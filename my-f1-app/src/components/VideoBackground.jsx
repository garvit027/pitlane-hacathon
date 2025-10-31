import React, { useRef, useEffect } from "react";


// A simple CSS object for the video styling
const videoStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100vw',
  height: '100vh',
  objectFit: 'cover', // This makes the video fill the screen without stretching
  zIndex: 1, // Sits behind the overlay (which is zIndex 10)
};

// A simple overlay to darken the video so text is more readable
const overlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.4)', // 40% black overlay
  zIndex: 2, // Sits on top of the video, but behind the UI
};

export default function VideoBackground() {
  const videoRef = useRef(null); // Create a ref to access the video element

  // This effect will run once when the component mounts
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return; // Exit if video element isn't loaded yet

    // This function runs every time the video's time updates
    const handleTimeUpdate = () => {
      // Check if the current time is 30 seconds or more
      if (video.currentTime >= 30) {
        video.currentTime = 0; // Reset to the beginning
        video.play(); // Ensure it keeps playing
      }
    };

    // Add the event listener to the video
    video.addEventListener('timeupdate', handleTimeUpdate);

    // Clean up the event listener when the component unmounts
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []); // The empty array [] means this effect runs only once

  return (
    <>
      <div style={overlayStyle} />
      <video
        ref={videoRef} // Attach the ref to the video element
        style={videoStyle}
        autoPlay  // Start playing immediately
        // We remove 'loop' because we are handling it manually
        muted     // **REQUIRED** for autoplay in all browsers
        playsInline // Required for iOS
        // Make sure this video file exists in your /public/videos/ folder
        src="/videos/YTDown.com_YouTube_F1-2023-This-Is-No-Ordinary-Sport_Media_viQC-6xoJ3E_001_1080p.mp4"
      />
    </>
  );
}

