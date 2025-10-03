const supabase = window.supabase.createClient(
  'https://qusuysieongbzlgczsha.supabase.co', // ← Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1c3V5c2llb25nYnpsZ2N6c2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzQxNDcsImV4cCI6MjA3NDkxMDE0N30.IREkltYFK65lH9BfQjUL4kUWmW7faGc6eGMRfUqyyd8' // ← Replace with your actual anon key
);

document.addEventListener("DOMContentLoaded", async () => {
  const englishContainer = document.getElementById("englishSongs");
  const hindiContainer = document.getElementById("hindiSongs");
  const teluguContainer = document.getElementById("teluguSongs");
  const favoritesContainer = document.getElementById("favorites");
  const searchInput = document.getElementById("search");

  let currentUserId = null;
  let userFavorites = [];

  // ✅ Get logged-in user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    alert("Please log in to view favorites.");
  } else {
    currentUserId = user.id;

    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("favorites")
      .eq("id", currentUserId)
      .single();

    if (fetchError || !userData) {
      console.error("User data not found:", fetchError);
      alert("User data not found.");
    } else {
      userFavorites = userData.favorites || [];
    }
  }

  // ✅ Load all songs
  const { data: songs, error: songError } = await supabase.from("songs").select("*");
  if (songError) {
    alert("Failed to load songs");
    return;
  }

  // ✅ Render song card
  const renderSongCard = (s) => {
    const imageUrl = s.image_url;
    const audioUrl = s.audio_url;
    const isFavorite = userFavorites.includes(s.id);

    return `
      <div class="song-card" data-title="${s.title.toLowerCase()}" data-artist="${s.artist.toLowerCase()}">
        <img src="${imageUrl}" alt="${s.title}" width="200"
             onerror="this.src='images/fallback.jpg'; this.onerror=null;"><br>
        <strong>${s.title}</strong> by ${s.artist} (${s.language})<br>
        <audio src="${audioUrl}" controls></audio><br>
        <button onclick="toggleFavorite('${s.id}')">
          ${isFavorite ? "💔 Remove" : "❤️ Favorite"}
        </button>
      </div>
    `;
  };

  // ✅ Render songs by language
  englishContainer.innerHTML = songs
    .filter((s) => s.language.toLowerCase() === "english")
    .map(renderSongCard)
    .join("");

  hindiContainer.innerHTML = songs
    .filter((s) => s.language.toLowerCase() === "hindi")
    .map(renderSongCard)
    .join("");

  teluguContainer.innerHTML = songs
    .filter((s) => s.language.toLowerCase() === "telugu")
    .map(renderSongCard)
    .join("");

  // ✅ Render favorites in sidebar
  const loadFavorites = async () => {
    if (!currentUserId || userFavorites.length === 0) {
      favoritesContainer.innerHTML = "<p>No favorites yet.</p>";
      return;
    }

    const { data: favSongs, error: favError } = await supabase
      .from("songs")
      .select("*")
      .in("id", userFavorites);

    if (favError) {
      console.error("Failed to load favorite songs:", favError);
      favoritesContainer.innerHTML = "<p>Error loading favorites.</p>";
      return;
    }

    favoritesContainer.innerHTML = favSongs.map((s) => {
      return `
        <div class="fav-song">
          <img src="${s.image_url}" alt="${s.title}" width="50"
               onerror="this.src='images/fallback.jpg'; this.onerror=null;">
          ${s.title}
        </div>
      `;
    }).join("");
  };

  // ✅ Toggle favorite
  window.toggleFavorite = async (songId) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("Please log in to manage favorites.");
      return;
    }

    const currentUserId = user.id;

    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("favorites")
      .eq("id", currentUserId)
      .single();

    if (fetchError || !userData) {
      alert("User data not found.");
      console.error("Fetch error:", fetchError);
      return;
    }

    let updatedFavorites = [...userData.favorites];

    if (updatedFavorites.includes(songId)) {
      updatedFavorites = updatedFavorites.filter(id => id !== songId);
    } else {
      updatedFavorites.push(songId);
    }

    console.log("Updating favorites for:", currentUserId);

    const { error: updateError } = await supabase
      .from("users")
      .update({ favorites: updatedFavorites })
      .eq("id", currentUserId);

    if (updateError) {
      alert("Failed to update favorites.");
      console.error("Update error:", updateError);
      return;
    }

    userFavorites = updatedFavorites;
    await loadFavorites();
    location.reload();
  };

  // ✅ Search functionality
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const allCards = document.querySelectorAll(".song-card");

    allCards.forEach((card) => {
      const title = card.getAttribute("data-title");
      const artist = card.getAttribute("data-artist");
      const match = title.includes(query) || artist.includes(query);
      card.style.display = match ? "block" : "none";
    });
  });

  await loadFavorites();
});