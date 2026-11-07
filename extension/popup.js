
function cleanFileName(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function buildTextFile(data) {
  let output = "";

  output += `Lecture Title: ${data.title}\n`;
  output += `Source: ${data.url}\n`;
  output += `Total Transcript Lines: ${data.transcript.length}\n`;
  output += `Important Moments Found: ${data.importantMoments.length}\n\n`;

  output += "====================================\n";
  output += "IMPORTANT MOMENTS WITH CONTEXT\n";
  output += "====================================\n\n";

  if (!data.importantMoments || data.importantMoments.length === 0) {
    output += "No important phrases detected.\n";
  } else {
    data.importantMoments.forEach((moment, index) => {
      output += `--- Important Moment ${index + 1} ---\n`;
      output += `Timestamp: [${moment.timestamp}]\n`;
      output += `Detected phrase: ${moment.detectedPhrase}\n\n`;

      output += "Context:\n";
      moment.context.forEach(line => {
        output += `[${line.timestamp}] ${line.text}\n`;
      });

      output += "\n";
    });
  }

  output += "\n\n====================================\n";
  output += "FULL TRANSCRIPT\n";
  output += "====================================\n\n";

  data.transcript.forEach(line => {
    output += `[${line.timestamp}] ${line.text}\n`;
  });

  return output;
}

function downloadTextFile(text, title) {
  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const safeTitle = cleanFileName(title || "Panopto_Lecture");

  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeTitle}_transcript.txt`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function extractTranscriptDirectly() {

  function timestampToSeconds(timestamp) {
    const parts = timestamp.split(":").map(Number);

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return Infinity;
  }

  function normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function removeDuplicates(lines) {
    const cleaned = [];
    const seen = new Set();

    for (const line of lines) {
      const normalized = normalizeText(line.text);

      if (!normalized || normalized.length < 3) continue;

      const key = `${line.timestamp}-${normalized}`;

      if (seen.has(key)) continue;

      seen.add(key);

      cleaned.push({
        timestamp: line.timestamp,
        text: line.text.trim()
      });
    }

    return cleaned;
  }

  function mergeNearbyDuplicates(lines) {
    const merged = [];

    for (const line of lines) {
      const last = merged[merged.length - 1];

      if (
        last &&
        last.timestamp === line.timestamp &&
        normalizeText(last.text) === normalizeText(line.text)
      ) {
        continue;
      }

      merged.push(line);
    }

    return merged;
  }

  function detectImportantMoments(lines) {
    const patterns = [
      // Explicit emphasis
      {
        regex: /חשוב|שימו\s*לב|שים\s*לב|נשים\s*לב/i,
        label: "lecturer emphasis"
      },
      {
        regex: /מבחן|בחינה|יופיע במבחן|יופיע בבחינה/i,
        label: "exam cue"
      },
      {
        regex: /צריך לזכור|תזכרו|חשוב להבין/i,
        label: "remember cue"
      },

      // Educational explanations
      {
        regex: /הגדר|מגדיר|הגדרה/i,
        label: "definition"
      },
      {
        regex: /מסקנ|נובע|לכן/i,
        label: "conclusion"
      },
      {
        regex: /כלומר|זאת אומרת|בעצם/i,
        label: "explanation"
      },
      {
        regex: /דוגמה|לדוגמה/i,
        label: "example"
      },

      // English
      {
        regex: /important|pay attention|key point/i,
        label: "lecturer emphasis"
      },
      {
        regex: /exam|on the test/i,
        label: "exam cue"
      },
      {
        regex: /remember|you should know/i,
        label: "remember cue"
      },
      {
        regex: /definition/i,
        label: "definition"
      }
    ];

    const moments = [];

    lines.forEach((line, index) => {
      const match = patterns.find(pattern =>
        pattern.regex.test(line.text)
      );

      if (!match) return;

      const start = Math.max(0, index - 2);
      const end = Math.min(lines.length, index + 3);

      moments.push({
        timestamp: line.timestamp,
        detectedPhrase: match.label,
        text: line.text,
        context: lines.slice(start, end)
      });
    });

    return moments;
  }

  // Extract only real caption entries from Panopto
  const captionRows = document.querySelectorAll(
    "#transcriptTabPane ul.event-tab-list[aria-label='Captions'] li.index-event"
  );

  const transcript = [];

  for (const row of captionRows) {
    const textElement = row.querySelector(".event-text");
    const timeElement = row.querySelector(".event-time");

    if (!textElement || !timeElement) continue;

    const timestamp = timeElement.textContent.trim();

    // Read caption spans only, excluding hidden controls
    const captionText = [...textElement.querySelectorAll("span")]
      .map(span => span.textContent.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!/^\d{1,2}:\d{2}(?::\d{2})?$/.test(timestamp)) continue;
    if (captionText.length < 3) continue;

    transcript.push({
      timestamp,
      text: captionText
    });
  }

  // Clean transcript
  let cleanedTranscript = removeDuplicates(transcript);

  cleanedTranscript.sort(
    (a, b) =>
      timestampToSeconds(a.timestamp) -
      timestampToSeconds(b.timestamp)
  );

  cleanedTranscript = mergeNearbyDuplicates(cleanedTranscript);

// TODO: Fix important-moment detection in a future update
const importantMoments = [];

  const testLine = {
  timestamp: "1:00",
  text: "שימו לב, זה מאוד חשוב למבחן"
};

const testResult = detectImportantMoments([testLine]);

return {
  title: document.title,
  url: window.location.href,
  transcript: cleanedTranscript,
  importantMoments,
  debug: {
    testResultCount: testResult.length,
    actualResultCount: importantMoments.length,
    directKeywordMatches: cleanedTranscript.filter(
      line => /חשוב|מבחן|שימו\s*לב/i.test(line.text)
    ).length
  }
};

  return {
    title: document.title,
    url: window.location.href,
    transcript: cleanedTranscript,
    importantMoments
  };
}

document.getElementById("extractBtn").addEventListener("click", async () => {
  const status = document.getElementById("status");
  status.textContent = "Extracting...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab || !tab.id) {
      status.textContent = "No active tab found.";
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractTranscriptDirectly
    });

    const data = results[0]?.result;
    console.log("Detection diagnostics:", data?.debug);

    if (!data || !data.transcript || data.transcript.length === 0) {
      status.textContent = "No transcript found.";
      return;
    }

    const text = buildTextFile(data);
    downloadTextFile(text, data.title);

    status.textContent =
      `Downloaded ${data.transcript.length} lines. ` +
      `Important: ${data.importantMoments.length}`;

  } catch (err) {
    console.error("Extraction error:", err);
    status.textContent = "Extraction failed.";
  }
});
