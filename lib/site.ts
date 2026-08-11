/**
 * Central place for the personal/portfolio copy so the components stay generic.
 * Edit this file to make the site your own.
 */
export const site = {
  name: "Atharva Satavi",
  role: "cybersecurity engineer · penetration tester",
  handle: "@dedfish404",
  bio: "Pentester and security researcher. I break into machines, chase root, and write up exactly how it went down — recon to privesc, every dead end included.",

  // Terminal `$ whoami && cat ~/about`
  skills: [
    "web app pentesting",
    "privilege escalation",
    "network / ad enumeration",
    "reverse engineering",
    "binary exploitation",
  ],
  cert: {
    label: "Google Cybersecurity Professional Certificate",
    year: "2025",
  },

  // Right-hand focus widget
  focus: {
    
    resume: {
      platform: "Resume",
      value: "click to view",
    },
  },

  tagline:
    "A running log of CTF solves and box teardowns — reproducible, no fluff, all the dead ends included.",

  contactHref: "mailto:atharvasatavi2005@gmail.com",
  resumeHref: "/resume.pdf",

  // Media box image — drop the file in /public and point here.
  mediaSrc: "/gif.jpg",

  // Lofi player — drop .mp3 files in /public/audio and list them here.
  tracks: [
    { title: "lofi", artist: "lofi", src: "/audio/track1.mp3" },
    { title: "zoltraak", artist: "frieren", src: "/audio/track2.mp3" },
    { title: "golden wind", artist: "jojo", src: "/audio/track3.mp3" },
    { title: "wisdom", artist: "atharva", src: "/audio/track4.mp3" },
  ],

  // Consolidated social footer — `icon` maps to a crisp inline SVG.
  links: [
    { label: "github", icon: "github", href: "https://github.com/dedfish101" },
    { label: "linkedin", icon: "linkedin", href: "https://www.linkedin.com/in/atharva-satvi--557674286/" },
    { label: "x / twitter", icon: "x", href: "https://x.com/Atharva_w_" },
    { label: "tryhackme", icon: "tryhackme", href: "https://tryhackme.com/p/dedfish404" },
  ],
};
