from flask import Flask, render_template, request, jsonify, send_from_directory
from chatbot import get_ai_response  # Import chatbot logic from chatbot.py
import os
import time
import torch
from transformers import VitsModel, AutoTokenizer
from scipy.io.wavfile import write

app = Flask(__name__)

# Load Hausa TTS model
# Use CPU if GPU is not available (important for Render's free tier, which is CPU-only)
device = "cuda" if torch.cuda.is_available() else "cpu"
model = VitsModel.from_pretrained("facebook/mms-tts-hau").to(device)
tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-hau")

# Ensure the audio directory exists
os.makedirs("static/audio", exist_ok=True)

def generate_tts(text):
    """Convert text response to speech and return audio file path."""
    try:
        # Tokenize the text
        inputs = tokenizer(text, return_tensors="pt").to(device)

        # Generate the waveform
        with torch.no_grad():
            output = model(**inputs).waveform.numpy()

        # Create a unique filename using a timestamp
        timestamp = int(time.time() * 1000)  # Milliseconds
        filename = f"response_{timestamp}.wav"
        filepath = os.path.join("static", "audio", filename)

        # Save the audio file
        write(filepath, model.config.sampling_rate, output[0])

        return filename
    except Exception as e:
        print(f"Error generating TTS: {e}")
        raise

@app.route("/")
def home():
    return render_template("index.html")  # Loads the frontend

@app.route("/chat", methods=["POST"])
def chat():
    try:
        user_message = request.json.get("message")
        if not user_message:
            return jsonify({"error": "Empty message"}), 400

        # Get AI response
        bot_response = get_ai_response(user_message)

        # Convert chatbot response to speech
        audio_filename = generate_tts(bot_response)

        # Return the response and audio URL
        return jsonify({
            "response": bot_response,
            "audioUrl": f"/static/audio/{audio_filename}"  # Use camelCase to match client-side expectation
        })
    except Exception as e:
        print(f"Error in /chat endpoint: {e}")
        return jsonify({"error": "Failed to process request"}), 500

@app.route("/static/audio/<filename>")
def serve_audio(filename):
    return send_from_directory("static/audio", filename)

@app.route('/models/<path:filename>')
def serve_model(filename):
    return send_from_directory('static/models', filename)

if __name__ == "__main__":
    # Bind to 0.0.0.0 and use the PORT environment variable for Render compatibility
    # Render assigns a port dynamically, so we use os.environ.get to fetch it
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False  # Disable debug mode in production for security and performance
    )