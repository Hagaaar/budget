// ─── Budget Mensuel — Google Apps Script Backend v3 ────────────────────────
// Si tu as déjà déployé, colle ce nouveau code, sauvegarde,
// puis Déployer → Gérer les déploiements → Modifier → Nouvelle version → Déployer
// IMPORTANT : ne clique jamais sur "Nouveau déploiement" pour une mise à jour,
// cela créerait une URL supplémentaire qui resterait active avec l'ancien code.

const SHEET_NAME = 'budget_data';

function doGet(e) {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const sh  = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const val = sh.getRange('A1').getValue();
  return ContentService
    .createTextOutput(val || '{}')
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === 'archive') {
      // Archiver dans un onglet nommé d'après le mois (ex: "Mai 2026")
      const mois = payload.mois || 'Archive';
      let archSheet = ss.getSheetByName(mois);
      if (!archSheet) archSheet = ss.insertSheet(mois);
      archSheet.getRange('A1').setValue(JSON.stringify(payload.data));
      archSheet.getRange('B1').setValue(new Date().toLocaleString('fr-FR'));
      archSheet.getRange('A2').setValue('Archivé le : ' + new Date().toLocaleString('fr-FR'));
    } else {
      // Garde anti-régression : refuse d'écraser des données existantes
      // avec un payload qui contient moins d'entrées (ex: état vide/corrompu).
      const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
      const existingRaw = sh.getRange('A1').getValue();
      let existingCount = 0;
      if (existingRaw) {
        try { existingCount = (JSON.parse(existingRaw).entries || []).length; } catch(_) {}
      }
      const incomingCount = (payload.entries || []).length;
      if (existingCount >= 5 && incomingCount === 0) {
        return ContentService.createTextOutput('rejected: empty payload would erase existing data');
      }
      sh.getRange('A1').setValue(e.postData.contents);
      sh.getRange('B1').setValue(new Date().toLocaleString('fr-FR'));
    }
  } catch(err) {
    Logger.log(err);
  }
  return ContentService.createTextOutput('ok');
}
