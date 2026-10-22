import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { DateTime } from 'luxon';
import { Meeting, MeetingState, Settings } from '../src/shared/types';
import { log } from './logService';

let db: Database.Database;

export const getDbPath = () => {
  return path.join(app.getPath('userData'), 'app.db');
};

export const initDb = () => {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    create table if not exists settings (
      id integer primary key,
      obsHost text not null,
      obsPort integer not null,
      obsPassword text not null,
      defaultRecordingBasePath text not null,
      zoomDownloadsPath text not null,
      timezone text not null
    );

    create table if not exists meetings (
      id integer primary key,
      meetingName text not null,
      zoomLink text not null,
      startUtc text not null,
      timezone text not null,
      recordingBasePath text not null,
      zoomDownloadsPath text not null,
      state text not null,
      createdAt text not null,
      updatedAt text not null,
      actualStartUtc text,
      actualStopUtc text,
      lastError text,
      metaPath text
    );
  `);

  const settingsRow = db.prepare('select count(*) as count from settings').get() as { count: number };
  if (settingsRow.count === 0) {
    db.prepare(
      `insert into settings (id, obsHost, obsPort, obsPassword, defaultRecordingBasePath, zoomDownloadsPath, timezone)
       values (1, ?, ?, ?, ?, ?, ?)`
    ).run('127.0.0.1', 4455, '', '', '', Intl.DateTimeFormat().resolvedOptions().timeZone);
    log('info', 'Initialized default settings');
  }

  const meetingRow = db.prepare('select count(*) as count from meetings').get() as { count: number };
  if (meetingRow.count === 0) {
    const nowUtc = DateTime.utc().plus({ minutes: 15 }).toISO();
    db.prepare(
      `insert into meetings
      (meetingName, zoomLink, startUtc, timezone, recordingBasePath, zoomDownloadsPath, state, createdAt, updatedAt)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'Example Standup',
      'https://zoom.us/j/123456789',
      nowUtc,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      '',
      '',
      'scheduled',
      new Date().toISOString(),
      new Date().toISOString()
    );
    log('info', 'Inserted seed meeting');
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export const getSettings = (): Settings => {
  const row = getDb().prepare('select * from settings where id = 1').get();
  return row as Settings;
};

export const saveSettings = (settings: Settings) => {
  getDb()
    .prepare(
      `update settings set obsHost = ?, obsPort = ?, obsPassword = ?, defaultRecordingBasePath = ?, zoomDownloadsPath = ?, timezone = ? where id = 1`
    )
    .run(
      settings.obsHost,
      settings.obsPort,
      settings.obsPassword,
      settings.defaultRecordingBasePath,
      settings.zoomDownloadsPath,
      settings.timezone
    );
};

export const listMeetings = (): Meeting[] => {
  const rows = getDb().prepare('select * from meetings order by startUtc asc').all();
  return rows as Meeting[];
};

export const getMeeting = (id: number): Meeting | undefined => {
  const row = getDb().prepare('select * from meetings where id = ?').get(id);
  return row as Meeting | undefined;
};

export const upsertMeeting = (meeting: Omit<Meeting, 'id' | 'state' | 'createdAt' | 'updatedAt'> & { id?: number; state?: MeetingState }) => {
  const now = new Date().toISOString();
  if (meeting.id) {
    getDb()
      .prepare(
        `update meetings set meetingName = ?, zoomLink = ?, startUtc = ?, timezone = ?, recordingBasePath = ?, zoomDownloadsPath = ?, state = ?, updatedAt = ? where id = ?`
      )
      .run(
        meeting.meetingName,
        meeting.zoomLink,
        meeting.startUtc,
        meeting.timezone,
        meeting.recordingBasePath,
        meeting.zoomDownloadsPath,
        meeting.state ?? 'scheduled',
        now,
        meeting.id
      );
    return meeting.id;
  }

  const result = getDb()
    .prepare(
      `insert into meetings (meetingName, zoomLink, startUtc, timezone, recordingBasePath, zoomDownloadsPath, state, createdAt, updatedAt)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      meeting.meetingName,
      meeting.zoomLink,
      meeting.startUtc,
      meeting.timezone,
      meeting.recordingBasePath,
      meeting.zoomDownloadsPath,
      meeting.state ?? 'scheduled',
      now,
      now
    );

  return Number(result.lastInsertRowid);
};

export const updateMeetingState = (id: number, state: MeetingState, data?: Partial<Meeting>) => {
  const existing = getMeeting(id);
  if (!existing) return;

  const merged: Meeting = {
    ...existing,
    ...data,
    state,
    updatedAt: new Date().toISOString()
  };

  getDb()
    .prepare(
      `update meetings set state = ?, updatedAt = ?, actualStartUtc = ?, actualStopUtc = ?, lastError = ?, metaPath = ? where id = ?`
    )
    .run(
      merged.state,
      merged.updatedAt,
      merged.actualStartUtc,
      merged.actualStopUtc,
      merged.lastError,
      merged.metaPath,
      id
    );
};

export const deleteMeeting = (id: number) => {
  getDb().prepare('delete from meetings where id = ?').run(id);
};
