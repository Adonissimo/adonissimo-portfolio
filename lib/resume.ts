export const resume = {
  focus: 'Computer Science student · Software Engineering',
  summary: 'I’m Lorenz, a Computer Science student at FEU Institute of Technology specializing in Software Engineering. I build full-stack web projects, contribute to Android applications, and make browser games.',
  opportunity: 'Seeking a software development internship to strengthen my programming fundamentals, contribute to real projects, and learn from experienced engineers.',
  approach: 'I use AI-assisted development tools in my academic and personal projects, alongside hands-on work with application interfaces, databases, and testing.',
  education: [
    { school: 'FEU Institute of Technology', qualification: 'BS Computer Science · Software Engineering specialization', period: 'September 2023 – present' },
    { school: 'STI College Caloocan', qualification: 'Information Communications Technology', period: 'September 2020 – July 2023' }
  ],
  contributions: [
    { title: 'SmartPath', type: 'Capstone · Android application', text: 'Contributed to the Android front end and Firebase backend. Implemented indoor positioning grid logic, configured 10 Bluetooth beacons on one DENR floor, and walked hallways to check distance estimates under interference.', detail: 'Kotlin, XML, Firebase · Android UI, navigation HUD, sign-up and login' },
    { title: 'ZeldaBonk', type: 'Personal project · Browser game', text: 'Built a browser survival game with Three.js visuals, eight realms, hero choices, upgrades, and saved progress. Play it directly from the project showcase.', detail: 'JavaScript, HTML, CSS, Three.js', href: '/projects/zeldabonk' },
    { title: 'Gacha-Balls', type: 'Collaborative project · Android game', text: 'Co-developed a game combining gacha mechanics, claw-machine gameplay, and physical prizes.', detail: 'Godot · Aseprite for sprite creation' }
  ],
  certifications: [
    { name: 'PMI Project Management Ready', issuer: 'Project Management Institute', date: 'December 2025' },
    { name: 'Information Technology Specialist in Python', issuer: 'Certiport', date: 'December 2025' },
    { name: 'Data Streaming Engineer Foundations', issuer: 'Confluent', date: 'September 2026' },
    { name: 'Data Streaming Engineer — Apache Flink', issuer: 'Confluent', date: 'September 2026' },
    { name: 'Learning MATLAB', issuer: 'LinkedIn Learning', date: 'December 2025' }
  ],
  leadership: [
    { title: 'CS Expo 2026 · Secretariat', text: 'Served as Day 2 Secretary and Day 3 Secretary Head. Prepared announcements, verified judges’ scoring sheets, delegated visitor support, and presented SmartPath to the panel.' },
    { title: 'Knights of the Most Blessed Sacrament', text: 'Member and Secretary since 2013; also edits publication graphics. Helped prepare schedules for 61 altar servers across five Sunday Mass times.' },
    { title: 'PPCRV · Election volunteer', text: 'Served at the Voters’ Assistance Desk in 2022 and 2025, and as a poll watcher in 2023.' }
  ]
} as const;

export const languageSkills = [
  { name: 'TypeScript', note: 'Web projects' },
  { name: 'JavaScript', note: 'Web & browser games' },
  { name: 'Kotlin', note: 'Android · novice' },
  { name: 'Java', note: 'Object-oriented programming' },
  { name: 'SQL', note: 'Web project databases' },
  { name: 'Python', note: 'Certiport certified' },
  { name: 'C++', note: 'Beginner' },
  { name: 'HTML', note: 'Competent' },
  { name: 'CSS', note: 'Web projects' },
  { name: 'PHP', note: 'Academic exposure' },
  { name: 'MATLAB', note: 'Academic exposure' }
] as const;

export const supportingSkills = [
  { title: 'Frameworks & libraries', items: 'Next.js, React, Tailwind CSS, Three.js' },
  { title: 'Cloud & databases', items: 'Firebase, Supabase, PostgreSQL' },
  { title: 'Mobile & games', items: 'Android Studio, XML, Godot, Aseprite' },
  { title: 'Tools & workflow', items: 'GitHub, Git Bash, Visual Studio Code, Vercel, Agile, Scrum' },
  { title: 'Coursework & exposure', items: 'Data structures and algorithms, Java OOP, cybersecurity, networking, Linux (Oracle VM), Cisco Packet Tracer, SAP S/4HANA' },
  { title: 'Creative tools & interests', items: 'Photoshop, Canva · Web and mobile development, DevOps, AI, automation' }
] as const;
