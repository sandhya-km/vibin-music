const supabase = window.supabase.createClient(
  "https://qusuysieongbzlgczsha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1c3V5c2llb25nYnpsZ2N6c2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzQxNDcsImV4cCI6MjA3NDkxMDE0N30.IREkltYFK65lH9BfQjUL4kUWmW7faGc6eGMRfUqyyd8"
);

document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    alert("You must be logged in to access this page.");
    window.location.href = "login.html";
    return;
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("email", user.email)
    .maybeSingle();

  if (!userData || userData.role !== "admin") {
    alert("Access denied. Redirecting to homepage.");
    window.location.href = "homepage.html";
    return;
  }

  const form = document.getElementById("addSongForm");
  const songList = document.getElementById("songList");

  const sanitize = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const loadSongs = async () => {
    const { data: songs, error } = await supabase.from("songs").select("*");
    if (error) {
      alert("Failed to load songs");
      console.error(error);
      return;
    }

    songList.innerHTML = songs.map((s) => {
      const imageUrl = supabase.storage
        .from("images")
        .getPublicUrl(s.image_url).data.publicUrl;

      const audioUrl = supabase.storage
        .from("song-assets")
        .getPublicUrl(s.audio_url).data.publicUrl;

      return `
        <div class="song-card">
          <img src="${imageUrl}" alt="${s.title}" width="200"><br>
          <strong>${s.title}</strong> by ${s.artist} (${s.language})<br>
          <audio src="${audioUrl}" controls></audio><br>
          <button onclick="deleteSong('${s.id}')">Delete</button>
        </div>
      `;
    }).join("");
  };

  form.onsubmit = async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const artist = document.getElementById("artist").value.trim();
    const language = document.getElementById("language").value;
    const imageFile = document.getElementById("imageFile").files[0];
    const audioFile = document.getElementById("audioFile").files[0];

    if (
      !imageFile || !audioFile ||
      imageFile.size === 0 || audioFile.size === 0 ||
      !imageFile.type.startsWith("image/") || !audioFile.type.startsWith("audio/")
    ) {
      alert("Please select valid image and audio files.");
      return;
    }

    const timestamp = Date.now();
    const imagePath = `${timestamp}_${sanitize(imageFile.name)}`;
    const audioPath = `${timestamp}_${sanitize(audioFile.name)}`;

    console.log("Uploading image to:", imagePath);
    console.log("Uploading audio to:", audioPath);

    const { error: imageError } = await supabase.storage
      .from("images")
      .upload(imagePath, imageFile, {
        contentType: imageFile.type || "image/png",
        upsert: true,
      });

    const { error: audioError } = await supabase.storage
      .from("song-assets")
      .upload(audioPath, audioFile, {
        contentType: audioFile.type || "audio/mpeg",
        upsert: true,
      });

    if (imageError || audioError) {
      alert("Upload failed");
      console.error("Image upload error:", imageError);
      console.error("Audio upload error:", audioError);
      return;
    }

    const { error: insertError } = await supabase.from("songs").insert([
      {
        title,
        artist,
        language,
        image_url: imagePath,
        audio_url: audioPath,
      },
    ]);

    if (insertError) {
      alert("Database insert failed");
      console.error(insertError);
    } else {
      alert("Song uploaded successfully!");
      form.reset();
      loadSongs();
    }
  };

  window.deleteSong = async (id) => {
    const { error } = await supabase.from("songs").delete().eq("id", id);
    if (error) {
      alert("Delete failed");
      console.error(error);
    } else {
      loadSongs();
    }
  };

  loadSongs();
});