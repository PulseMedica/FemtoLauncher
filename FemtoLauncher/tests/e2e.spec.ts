import type {ElectronApplication} from 'playwright';
import {_electron as electron} from 'playwright';
import {afterAll, beforeAll} from 'vitest';

let electronApp: ElectronApplication;

beforeAll(async () => {
  electronApp = await electron.launch({args: ['.']});
});

afterAll(async () => {
  await electronApp.close();
});
