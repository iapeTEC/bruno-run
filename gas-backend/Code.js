// Bruno Run - Google Apps Script Backend & Database API
// Automatically creates/manages Google Spreadsheet for scores and rankings

const APP_NAME = "Bruno Run - Banco de Dados de Pontuações";

function getOrCreateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SPREADSHEET_ID");
  
  let ss;
  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (e) {
      ss = null;
    }
  }

  if (!ss) {
    ss = SpreadsheetApp.create(APP_NAME);
    id = ss.getId();
    props.setProperty("SPREADSHEET_ID", id);
    
    try {
      const file = DriveApp.getFileById(id);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}
  }

  return ss;
}

function getRankingSheet() {
  const ss = getOrCreateSpreadsheet();
  let sheet = ss.getSheetByName("Ranking");
  if (!sheet) {
    sheet = ss.insertSheet("Ranking");
    const headers = [["Data e Hora", "Nome do Piloto", "Pontuação", "Fase Atingida", "Distância Percorrida"]];
    sheet.getRange(1, 1, 1, 5).setValues(headers)
      .setBackground("#050814")
      .setFontColor("#00e5ff")
      .setFontWeight("bold")
      .setFontSize(11)
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 170);
    sheet.setColumnWidth(2, 190);
    sheet.setColumnWidth(3, 130);
    sheet.setColumnWidth(4, 200);
    sheet.setColumnWidth(5, 160);
  }
  return sheet;
}

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    
    // Save score via GET
    if (params.action === "save" || (params.player && params.score)) {
      return recordScore(params);
    }
    
    // Get Leaderboard JSON
    if (params.action === "leaderboard") {
      return createJsonResponse({
        status: "success",
        leaderboard: getTopScores(),
        spreadsheetUrl: getOrCreateSpreadsheet().getUrl()
      });
    }

    // Default HTML page
    return renderLeaderboardHtml();
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter;
    }
    return recordScore(data);
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function recordScore(data) {
  const sheet = getRankingSheet();
  const player = (data.player || data.playerName || "Piloto Anônimo").toString().trim();
  const score = parseInt(data.score || 0, 10);
  const stage = (data.stage || "Fase 1").toString();
  const distance = Math.floor(parseFloat(data.distance || 0)) + " m";
  
  const timestamp = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
  
  sheet.appendRow([timestamp, player, score, stage, distance]);
  
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1, 1, 5).setHorizontalAlignment("center");

  const topScores = getTopScores();
  
  return createJsonResponse({
    status: "success",
    message: "Pontuação salva com sucesso no Google Sheets!",
    saved: { player: player, score: score, stage: stage },
    leaderboard: topScores,
    spreadsheetUrl: getOrCreateSpreadsheet().getUrl()
  });
}

function getTopScores() {
  const sheet = getRankingSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  values.sort((a, b) => (Number(b[2]) || 0) - (Number(a[2]) || 0));

  return values.slice(0, 10).map((row, index) => ({
    rank: index + 1,
    date: row[0],
    player: row[1],
    score: row[2],
    stage: row[3],
    distance: row[4]
  }));
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function renderLeaderboardHtml() {
  const top = getTopScores();
  const ssUrl = getOrCreateSpreadsheet().getUrl();

  let rowsHtml = "";
  top.forEach(r => {
    rowsHtml += `
      <tr>
        <td style="font-weight:900; color:#ffb300;">#${r.rank}</td>
        <td style="font-weight:700; color:#ffffff;">${r.player}</td>
        <td style="font-family:monospace; font-weight:900; color:#00e5ff;">${r.score}</td>
        <td style="color:#90caf9;">${r.stage}</td>
        <td style="font-size:12px; color:#78909c;">${r.date}</td>
      </tr>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Bruno Run - Ranking Oficial</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { background:#050814; color:#fff; font-family:-apple-system,BlinkMacSystemFont,sans-serif; text-align:center; padding:24px 16px; margin:0; }
        h1 { color:#00e5ff; letter-spacing:2px; margin-bottom:4px; text-shadow:0 0 20px #00e5ff; }
        p { color:#90caf9; margin-bottom:16px; font-size:14px; }
        .sheet-link { display:inline-block; margin-bottom:20px; color:#ffb300; text-decoration:none; font-weight:bold; font-size:13px; border:1px solid #ffb300; padding:6px 14px; border-radius:20px; }
        .sheet-link:hover { background:rgba(255,179,0,0.15); }
        table { width:100%; max-width:680px; margin:0 auto; border-collapse:collapse; background:rgba(16,28,56,0.85); border-radius:12px; overflow:hidden; box-shadow:0 0 25px rgba(0,229,255,0.2); }
        th, td { padding:12px 14px; border-bottom:1px solid rgba(0,229,255,0.2); }
        th { background:rgba(10,20,40,0.9); color:#00e5ff; font-size:12px; text-transform:uppercase; }
        tr:hover { background:rgba(0,229,255,0.1); }
      </style>
    </head>
    <body>
      <h1>🚀 BRUNO RUN</h1>
      <p>Banco de Dados & Ranking Oficial (Google Sheets)</p>
      <a class="sheet-link" href="${ssUrl}" target="_blank">📊 Abrir Planilha no Google Sheets</a>
      <table>
        <thead>
          <tr>
            <th>Pos</th>
            <th>Piloto</th>
            <th>Pontos</th>
            <th>Nave / Fase</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="5" style="padding:24px; color:#78909c;">Nenhuma pontuação registrada ainda. Seja o primeiro piloto!</td></tr>'}
        </tbody>
      </table>
    </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html).setTitle("Bruno Run - Ranking Oficial");
}
