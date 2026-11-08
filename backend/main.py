
from fastapi import FastAPI, HTTPException, UploadFile, File
import re
import json
from pathlib import Path
from uuid import UUID, uuid4

app = FastAPI(
    title="AI Lecture Intelligence API",
    version="0.1.0"
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "AI Lecture Intelligence",
        "version": "0.1.0"
    }



from pydantic import BaseModel


class TranscriptRequest(BaseModel):
    lecture_title: str
    language: str
    transcript: str




def parse_transcript(transcript: str):
    segments = []

    pattern = r"^\[(?:(\d+):)?(\d{1,2}):(\d{2})\]\s*(.*)$"

    for line in transcript.splitlines():
        match = re.match(pattern, line.strip())

        if not match:
            continue

        hours, minutes, seconds, text = match.groups()

        hours = int(hours) if hours is not None else 0
        minutes = int(minutes)
        seconds = int(seconds)

        start_seconds = (
            hours * 3600
            + minutes * 60
            + seconds
        )

        segments.append({
            "timestamp": f"{hours:02d}:{minutes:02d}:{seconds:02d}",
            "start_seconds": start_seconds,
            "text": text.strip()
        })

    return segments



def save_transcript(data: TranscriptRequest, segments: list):
    transcript_id = str(uuid4())

    storage_dir = Path(__file__).resolve().parent / "data" / "transcripts"
    storage_dir.mkdir(parents=True, exist_ok=True)

    transcript_record = {
        "id": transcript_id,
        "lecture_title": data.lecture_title,
        "language": data.language,
        "original_transcript": data.transcript,
        "segment_count": len(segments),
        "segments": segments
    }

    file_path = storage_dir / f"{transcript_id}.json"

    with file_path.open("w", encoding="utf-8") as file:
        json.dump(
            transcript_record,
            file,
            ensure_ascii=False,
            indent=2
        )

    return transcript_id




@app.post("/transcripts")
def receive_transcript(data: TranscriptRequest):
    if not data.lecture_title.strip():
        raise HTTPException(
            status_code=422,
            detail="Lecture title cannot be empty"
        )

    if not data.transcript.strip():
        raise HTTPException(
            status_code=422,
            detail="Transcript cannot be empty"
        )

    segments = parse_transcript(data.transcript)

    if not segments:
        raise HTTPException(
            status_code=422,
            detail="No valid timestamped segments found"
        )

    transcript_id = save_transcript(data, segments)

    return {
        "message": "Transcript processed and saved successfully",
        "transcript_id": transcript_id,
        "lecture_title": data.lecture_title,
        "language": data.language,
        "character_count": len(data.transcript),
        "segment_count": len(segments),
        "segments": segments
    }



@app.get("/transcripts/{transcript_id}")
def get_transcript(transcript_id: str):
    storage_dir = Path(__file__).resolve().parent / "data" / "transcripts"

    try:
        transcript_uuid = str(UUID(transcript_id))
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Invalid transcript ID format"
        )

    file_path = storage_dir / f"{transcript_uuid}.json"

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Transcript not found"
        )

    with file_path.open("r", encoding="utf-8") as file:
        transcript_record = json.load(file)

    return transcript_record



@app.post("/transcripts/upload")
async def upload_transcript(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".txt"):
        raise HTTPException(
            status_code=422,
            detail="Only TXT files are supported"
        )

    content = await file.read()

    try:
        transcript_text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=422,
            detail="File must be UTF-8 encoded"
        )

    segments = parse_transcript(transcript_text)

    if not segments:
        raise HTTPException(
            status_code=422,
            detail="No valid timestamped segments found"
        )

    lecture_title = file.filename.rsplit(".", 1)[0]

    data = TranscriptRequest(
        lecture_title=lecture_title,
        language="he",
        transcript=transcript_text
    )

    transcript_id = save_transcript(data, segments)

    return {
        "message": "TXT transcript uploaded and saved successfully",
        "transcript_id": transcript_id,
        "lecture_title": lecture_title,
        "segment_count": len(segments),
        "first_segment": segments[0],
        "last_segment": segments[-1]
    }
