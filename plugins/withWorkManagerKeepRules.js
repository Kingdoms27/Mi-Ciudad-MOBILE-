// Expo SDK 58 / Android release: R8 elimina constructores usados por
// WorkManager y Room mediante reflexion. La app se cerraba en el splash:
// Failed to create an instance of androidx.work.impl.WorkDatabase.canonicalName
// Referencias: expo/expo#52173 y expo/expo#51337.
const fs = require('node:fs/promises');
const path = require('node:path');
const { withDangerousMod } = require('expo/config-plugins');

const ROOM_RULE = '-keep class * extends androidx.room.RoomDatabase { <init>(); }';
const WORK_RULE = '-keep class * extends androidx.work.InputMerger { <init>(); }';

module.exports = function withWorkManagerKeepRules(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const filePath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro',
      );
      let contents = await fs.readFile(filePath, 'utf8');
      const missing = [ROOM_RULE, WORK_RULE].filter((rule) => !contents.includes(rule));

      if (missing.length > 0) {
        contents += '\n# Fix Expo SDK 58: conservar constructores WorkManager/Room usados por reflexion\n';
        contents += missing.join('\n') + '\n';
        await fs.writeFile(filePath, contents, 'utf8');
      }
      return modConfig;
    },
  ]);
};
