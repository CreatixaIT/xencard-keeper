export default function handler(req: any, res: any) {
  res.status(200).json({
    latestVersion: '1.0.0',
    minimumVersion: '1.0.0',
    downloadUrl: 'https://xencard.com/download',
    releaseNotes: [
      'Initial release',
      'Offline-first contact management',
      'Xeni AI assistant',
      'Business card scanning',
      'Personal visiting card',
    ],
  });
}
