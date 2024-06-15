let currentSong;
let currentSongIndex = -1;
let songs = [];
let albums = {
    "happy_hits": [],
    "romantic_hits": []
};

const fetchSongs = async (album) => {
    try {
        let response = await fetch(`https://api.github.com/repos/Bhanu201998/my-music-app/contents/songs/${album}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();
        let albumSongs = data.filter(file => file.name.endsWith(".mp3")).map(file => file.download_url);
        albums[album] = albumSongs;
        return albumSongs;
    } catch (error) {
        console.error("Error fetching the songs:", error);
    }
};

const loadAlbum = async (album) => {
    songs = await fetchSongs(album);
    if (songs.length > 0) {
        let songUL = document.querySelector(".ul");
        if (songUL) {
            songUL.innerHTML = "";

            songs.forEach((song, index) => {
                let songName = decodeURIComponent(song.split('/').pop().replaceAll("%20", " "));
                let li = document.createElement("li");
                li.textContent = songName;
                li.dataset.songUrl = song;
                li.addEventListener("click", () => playMusic(index));
                songUL.appendChild(li);
            });
        }

        // Show the library sections when an album is loaded
        let mainElement = document.querySelector('.main');
        if (mainElement) {
            mainElement.classList.add('show-library');
        }
    } else {
        console.log("No songs found.");
    }
};

const playMusic = (index) => {
    if (index < 0 || index >= songs.length) return;

    currentSongIndex = index;
    const track = songs[index];

    if (!currentSong) {
        currentSong = new Audio();
    } else {
        currentSong.pause();
        currentSong.currentTime = 0;
    }
    currentSong.src = track;
    currentSong.play();
    const playButton = document.getElementById("play");
    if (playButton) playButton.src = "pause.svg";

    let songName = decodeURIComponent(track.split('/').pop().replaceAll("%20", " "));
    const songInfo = document.querySelector(".songinfo");
    if (songInfo) songInfo.innerHTML = songName;
    const songTime = document.querySelector(".songtime");
    if (songTime) songTime.innerHTML = "00:00 / 00:00";

    currentSong.removeEventListener("timeupdate", updateSongTime);
    currentSong.removeEventListener("timeupdate", updateSeekBar);
    currentSong.addEventListener("timeupdate", updateSongTime);
    currentSong.addEventListener("timeupdate", updateSeekBar);

    const volumeControl = document.getElementById("volume");
    if (volumeControl) currentSong.volume = volumeControl.value;
};

const updateSongTime = () => {
    if (currentSong) {
        let currentTime = formatTime(currentSong.currentTime);
        let duration = formatTime(currentSong.duration);
        const songTime = document.querySelector(".songtime");
        if (songTime) songTime.innerHTML = `${currentTime} / ${duration}`;
    }
};

const updateSeekBar = () => {
    const seekbar = document.getElementById("seekbar");
    const cirule = document.getElementById("cirule");
    if (seekbar && cirule && currentSong && currentSong.duration) {
        const seekbarWidth = seekbar.clientWidth;
        const position = (currentSong.currentTime / currentSong.duration) * seekbarWidth;
        cirule.style.left = `${position}px`;
    } else if (cirule) {
        cirule.style.left = `0px`;
    }
};

const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    let minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const playPreviousSong = () => {
    if (currentSongIndex > 0) playMusic(currentSongIndex - 1);
};

const playNextSong = () => {
    if (currentSongIndex < songs.length - 1) {
        playMusic(currentSongIndex + 1);
    } else {
        console.log("End of playlist reached.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // Event listener for .card elements
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", () => {
            let album = card.getAttribute("data-album");
            loadAlbum(album);
        });
    });

    // Event listener for play/pause button
    const playButton = document.getElementById("play");
    if (playButton) {
        playButton.addEventListener("click", () => {
            if (currentSong) {
                if (currentSong.paused) {
                    currentSong.play();
                    playButton.src = "pause.svg";
                } else {
                    currentSong.pause();
                    playButton.src = "audioplay.svg";
                }
            }
        });
    }

    // Event listener for volume control
    const volumeControl = document.getElementById("volume");
    if (volumeControl) {
        volumeControl.addEventListener("input", () => {
            if (currentSong) currentSong.volume = volumeControl.value;
        });
    }

    // Event listener for seek bar
    const seekbar = document.getElementById("seekbar");
    const cirule = document.getElementById("cirule");
    if (seekbar && cirule) {
        seekbar.addEventListener("click", (event) => {
            const seekbarWidth = seekbar.clientWidth;
            const offsetX = event.offsetX;
            const newTime = (offsetX / seekbarWidth) * currentSong.duration;
            currentSong.currentTime = newTime;
        });

        let isDragging = false;
        cirule.addEventListener("mousedown", () => {
            isDragging = true;
        });

        document.addEventListener("mousemove", (event) => {
            if (isDragging) {
                const seekbarRect = seekbar.getBoundingClientRect();
                let offsetX = event.clientX - seekbarRect.left;
                offsetX = Math.max(0, Math.min(seekbar.clientWidth, offsetX));
                const newTime = (offsetX / seekbar.clientWidth) * currentSong.duration;
                currentSong.currentTime = newTime;
            }
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) isDragging = false;
        });

        cirule.addEventListener("touchstart", () => {
            isDragging = true;
        });

        document.addEventListener("touchmove", (event) => {
            if (isDragging && event.touches.length > 0) {
                const touch = event.touches[0];
                const seekbarRect = seekbar.getBoundingClientRect();
                let offsetX = touch.clientX - seekbarRect.left;
                offsetX = Math.max(0, Math.min(seekbar.clientWidth, offsetX));
                const newTime = (offsetX / seekbar.clientWidth) * currentSong.duration;
                currentSong.currentTime = newTime;
            }
        });

        document.addEventListener("touchend", () => {
            if (isDragging) isDragging = false;
        });
    }

    // Event listener for previous song button
    const prevButton = document.querySelector(".audioplaybtn[src='preaudio.svg']");
    if (prevButton) {
        prevButton.addEventListener("click", () => {
            console.log("Previous button clicked");
            playPreviousSong();
        });
    }

    // Event listener for next song button
    const nextButton = document.querySelector(".audioplaybtn[src='nextaudio.svg']");
    if (nextButton) {
        nextButton.addEventListener("click", () => {
            console.log("Next button clicked");
            playNextSong();
        });
    }

    // Event listener for close library button
    const closeLibraryButton = document.getElementById("closeLibrary");
    if (closeLibraryButton) {
        closeLibraryButton.addEventListener("click", () => {
            let mainElement = document.querySelector('.main');
            if (mainElement) {
                mainElement.classList.remove('show-library');
            }
        });
    }
});
