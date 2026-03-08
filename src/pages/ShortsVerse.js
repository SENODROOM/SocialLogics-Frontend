/**
 * ShortsVerse.js  ─  frontend/src/pages/ShortsVerse.js
 *
 * ARCHITECTURE
 * ────────────
 * Every card plays a real YouTube video iframe — 100% reliable embeds.
 * Each card is skinned to look like its platform (TikTok dark theme,
 * Instagram gradient, Facebook blue, Snapchat yellow, YouTube red).
 * The "Open on [Platform]" button deep-links to the real platform search.
 *
 * POOLS
 * ─────
 * 5 themed pools of YouTube video IDs, one per platform style:
 *   YT_POOL  — music/viral/trending (YouTube Shorts skin)
 *   TT_POOL  — dance/challenge/viral (TikTok skin)
 *   IG_POOL  — lifestyle/travel/food (Instagram Reels skin)
 *   FB_POOL  — family/community/DIY (Facebook Reels skin)
 *   SC_POOL  — sports/nature/cinematic (Snapchat Spotlight skin)
 *
 * Anti-repeat: module-level pools shuffle on exhaustion (double-shuffle
 * guarantees different order). 25+ videos per pool = very little repetition.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO POOLS — all real YouTube IDs, grouped by platform theme
// ─────────────────────────────────────────────────────────────────────────────

// YouTube Shorts skin — music, viral, pop culture
const YT_POOL = [
  {
    ytId: "jNQXAC9IVRw",
    title: "First Ever YouTube Video",
    creator: "@jawed",
    cat: "History",
  },
  {
    ytId: "9bZkp7q19f0",
    title: "Gangnam Style — PSY",
    creator: "@officialpsy",
    cat: "Music",
  },
  {
    ytId: "kffacxfA7G4",
    title: "Baby Shark Dance",
    creator: "@pinkfong",
    cat: "Kids",
  },
  {
    ytId: "JGwWNGJdvx8",
    title: "Shape of You — Ed Sheeran",
    creator: "@edsheeran",
    cat: "Music",
  },
  {
    ytId: "OPf0YbXqDm0",
    title: "Uptown Funk — Mark Ronson ft Bruno Mars",
    creator: "@markronson",
    cat: "Music",
  },
  {
    ytId: "YQHsXMglC9A",
    title: "Hello — Adele",
    creator: "@adele",
    cat: "Music",
  },
  {
    ytId: "RgKAFK5djSk",
    title: "See You Again — Wiz Khalifa",
    creator: "@wizkhalifa",
    cat: "Music",
  },
  {
    ytId: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up — Rick Astley",
    creator: "@rickastley",
    cat: "Comedy",
  },
  {
    ytId: "CevxZvSJLk8",
    title: "Roar — Katy Perry",
    creator: "@katyperry",
    cat: "Music",
  },
  {
    ytId: "iS1g8G_njx8",
    title: "The Scientist — Coldplay",
    creator: "@coldplay",
    cat: "Music",
  },
  {
    ytId: "IcrbM1l_BoI",
    title: "Wake Me Up — Avicii",
    creator: "@avicii",
    cat: "Music",
  },
  {
    ytId: "H5v3kku4y6Q",
    title: "Blinding Lights — The Weeknd",
    creator: "@theweeknd",
    cat: "Music",
  },
  {
    ytId: "hT_nvWreIhg",
    title: "Counting Stars — OneRepublic",
    creator: "@onerepublic",
    cat: "Music",
  },
  {
    ytId: "kXYiU_JCYtU",
    title: "Numb — Linkin Park",
    creator: "@linkinpark",
    cat: "Music",
  },
  {
    ytId: "09R8_2nJtjg",
    title: "Sugar — Maroon 5",
    creator: "@maroon5",
    cat: "Music",
  },
  {
    ytId: "7wtfhZwyrcc",
    title: "Levitating — Dua Lipa",
    creator: "@dualipa",
    cat: "Music",
  },
  {
    ytId: "uelHwf8o7_U",
    title: "Stay — Kid Laroi & Justin Bieber",
    creator: "@kidlaroi",
    cat: "Music",
  },
  {
    ytId: "72UO0y_SHws",
    title: "Astronaut in the Ocean — Masked Wolf",
    creator: "@maskedwolf",
    cat: "Music",
  },
  {
    ytId: "SlPhMPnQ58k",
    title: "Thinking Out Loud — Ed Sheeran",
    creator: "@edsheeran",
    cat: "Music",
  },
  {
    ytId: "2Vv-BfVoq4g",
    title: "Perfect — Ed Sheeran",
    creator: "@edsheeran",
    cat: "Music",
  },
  {
    ytId: "bo_efYLyVmo",
    title: "Watermelon Sugar — Harry Styles",
    creator: "@harrystyles",
    cat: "Music",
  },
  {
    ytId: "60ItHLz5WEA",
    title: "Faded — Alan Walker",
    creator: "@alanwalker",
    cat: "Music",
  },
  {
    ytId: "e-ORhEE9VVg",
    title: "Girl on Fire — Alicia Keys",
    creator: "@aliciakeys",
    cat: "Music",
  },
  {
    ytId: "OkGOOmv_Hjo",
    title: "God is a Woman — Ariana Grande",
    creator: "@arianagrande",
    cat: "Music",
  },
  {
    ytId: "lp-EO5I60KA",
    title: "Without Me — Eminem",
    creator: "@eminem",
    cat: "Music",
  },
  {
    ytId: "ru0K8uYEZWw",
    title: "Fight Song — Rachel Platten",
    creator: "@rachelplatten",
    cat: "Music",
  },
  {
    ytId: "pRpeEdMmmQ0",
    title: "Waka Waka — Shakira",
    creator: "@shakira",
    cat: "Sports",
  },
  {
    ytId: "fRh_vgS2dFE",
    title: "Sorry — Justin Bieber",
    creator: "@justinbieber",
    cat: "Music",
  },
  {
    ytId: "nfWlot6h_JM",
    title: "Shake It Off — Taylor Swift",
    creator: "@taylorswift",
    cat: "Music",
  },
  {
    ytId: "tgbNymZ7vqY",
    title: "Surf Beginner Tips",
    creator: "@surftips",
    cat: "Sports",
  },
];

// TikTok skin — dance, challenge, viral, trending
const TT_POOL = [
  {
    ytId: "OPf0YbXqDm0",
    title: "Uptown Funk Challenge",
    creator: "@markronson",
    cat: "Dance",
    query: "dance challenge trending",
  },
  {
    ytId: "nfWlot6h_JM",
    title: "Shake It Off Dance",
    creator: "@taylorswift",
    cat: "Challenge",
    query: "shake it off challenge",
  },
  {
    ytId: "CevxZvSJLk8",
    title: "Roar Dance Cover",
    creator: "@katyperry",
    cat: "Dance",
    query: "roar dance challenge",
  },
  {
    ytId: "H5v3kku4y6Q",
    title: "Blinding Lights Dance",
    creator: "@theweeknd",
    cat: "Viral",
    query: "blinding lights tiktok",
  },
  {
    ytId: "7wtfhZwyrcc",
    title: "Levitating Dance Trend",
    creator: "@dualipa",
    cat: "Dance",
    query: "levitating dance trend",
  },
  {
    ytId: "uelHwf8o7_U",
    title: "Stay Trending Audio",
    creator: "@kidlaroi",
    cat: "Trending",
    query: "stay tiktok trend",
  },
  {
    ytId: "09R8_2nJtjg",
    title: "Sugar Music Challenge",
    creator: "@maroon5",
    cat: "Music",
    query: "sugar challenge tiktok",
  },
  {
    ytId: "kXYiU_JCYtU",
    title: "Numb Viral Edit",
    creator: "@linkinpark",
    cat: "Viral",
    query: "numb viral edit",
  },
  {
    ytId: "hT_nvWreIhg",
    title: "Counting Stars Trend",
    creator: "@onerepublic",
    cat: "Trending",
    query: "counting stars tiktok",
  },
  {
    ytId: "IcrbM1l_BoI",
    title: "Wake Me Up Dance",
    creator: "@avicii",
    cat: "Dance",
    query: "wake me up dance tiktok",
  },
  {
    ytId: "60ItHLz5WEA",
    title: "Faded Edit Trend",
    creator: "@alanwalker",
    cat: "Viral",
    query: "faded alan walker tiktok",
  },
  {
    ytId: "dQw4w9WgXcQ",
    title: "Never Gonna Rickroll",
    creator: "@rickastley",
    cat: "Comedy",
    query: "rickroll funny tiktok",
  },
  {
    ytId: "bo_efYLyVmo",
    title: "Watermelon Sugar Challenge",
    creator: "@harrystyles",
    cat: "Challenge",
    query: "watermelon sugar tiktok",
  },
  {
    ytId: "72UO0y_SHws",
    title: "Astronaut in the Ocean Dance",
    creator: "@maskedwolf",
    cat: "Dance",
    query: "astronaut ocean dance",
  },
  {
    ytId: "JGwWNGJdvx8",
    title: "Shape of You Dance Edit",
    creator: "@edsheeran",
    cat: "Dance",
    query: "shape of you dance tiktok",
  },
  {
    ytId: "OkGOOmv_Hjo",
    title: "God is a Woman Trend",
    creator: "@arianagrande",
    cat: "Trending",
    query: "ariana grande tiktok",
  },
  {
    ytId: "RgKAFK5djSk",
    title: "See You Again Sad Edit",
    creator: "@wizkhalifa",
    cat: "Viral",
    query: "see you again sad edit",
  },
  {
    ytId: "YQHsXMglC9A",
    title: "Hello Challenge",
    creator: "@adele",
    cat: "Challenge",
    query: "hello adele challenge",
  },
  {
    ytId: "ru0K8uYEZWw",
    title: "Fight Song Motivation",
    creator: "@rachelplatten",
    cat: "Motivation",
    query: "fight song motivational",
  },
  {
    ytId: "e-ORhEE9VVg",
    title: "Girl on Fire Viral",
    creator: "@aliciakeys",
    cat: "Viral",
    query: "girl on fire tiktok",
  },
  {
    ytId: "lp-EO5I60KA",
    title: "Without Me Rap Edit",
    creator: "@eminem",
    cat: "Rap",
    query: "eminem rap tiktok",
  },
  {
    ytId: "SlPhMPnQ58k",
    title: "Thinking Out Loud Duet",
    creator: "@edsheeran",
    cat: "Duet",
    query: "thinking out loud tiktok",
  },
  {
    ytId: "2Vv-BfVoq4g",
    title: "Perfect Duet Trend",
    creator: "@edsheeran",
    cat: "Duet",
    query: "perfect ed sheeran duet",
  },
  {
    ytId: "pRpeEdMmmQ0",
    title: "Waka Waka Sports Edit",
    creator: "@shakira",
    cat: "Sports",
    query: "waka waka sports tiktok",
  },
  {
    ytId: "fRh_vgS2dFE",
    title: "Sorry Dance Challenge",
    creator: "@justinbieber",
    cat: "Challenge",
    query: "sorry bieber dance",
  },
];

// Instagram Reels skin — lifestyle, food, travel, aesthetic
const IG_POOL = [
  {
    ytId: "tgbNymZ7vqY",
    title: "Golden Hour Surf Session",
    creator: "@surf.daily",
    cat: "Lifestyle",
    query: "golden hour surf reels",
  },
  {
    ytId: "iS1g8G_njx8",
    title: "Aesthetic Chill Vibes",
    creator: "@coldplay",
    cat: "Aesthetic",
    query: "aesthetic chill vibes",
  },
  {
    ytId: "JGwWNGJdvx8",
    title: "Shape of You Travel Reel",
    creator: "@travel.reels",
    cat: "Travel",
    query: "travel reel music",
  },
  {
    ytId: "7wtfhZwyrcc",
    title: "Morning Routine Aesthetic",
    creator: "@morningvibes",
    cat: "Lifestyle",
    query: "morning routine aesthetic",
  },
  {
    ytId: "YQHsXMglC9A",
    title: "Rainy Day Cozy Reel",
    creator: "@cozyliving",
    cat: "Lifestyle",
    query: "rainy day cozy reels",
  },
  {
    ytId: "bo_efYLyVmo",
    title: "Summer Beach Reel",
    creator: "@beachlife",
    cat: "Travel",
    query: "summer beach instagram reel",
  },
  {
    ytId: "hT_nvWreIhg",
    title: "City Night Lights Reel",
    creator: "@cityvibes",
    cat: "Urban",
    query: "city night lights reels",
  },
  {
    ytId: "2Vv-BfVoq4g",
    title: "Wedding Reel Highlight",
    creator: "@weddingfilms",
    cat: "Wedding",
    query: "wedding highlight reel",
  },
  {
    ytId: "H5v3kku4y6Q",
    title: "Gym Aesthetic Reel",
    creator: "@fitaesthetic",
    cat: "Fitness",
    query: "gym aesthetic reel",
  },
  {
    ytId: "IcrbM1l_BoI",
    title: "Festival Vibe Reel",
    creator: "@festivalvibes",
    cat: "Music",
    query: "festival vibe reel",
  },
  {
    ytId: "60ItHLz5WEA",
    title: "Road Trip Reel",
    creator: "@roadtrippers",
    cat: "Travel",
    query: "road trip reel aesthetic",
  },
  {
    ytId: "CevxZvSJLk8",
    title: "Food Aesthetic Reel",
    creator: "@foodie.reels",
    cat: "Food",
    query: "food aesthetic reel",
  },
  {
    ytId: "uelHwf8o7_U",
    title: "Couple Goals Reel",
    creator: "@couplegoals",
    cat: "Romance",
    query: "couple goals reel",
  },
  {
    ytId: "09R8_2nJtjg",
    title: "Sunset Drive Reel",
    creator: "@sunsetdrives",
    cat: "Travel",
    query: "sunset drive reel",
  },
  {
    ytId: "OkGOOmv_Hjo",
    title: "Fashion Look Book Reel",
    creator: "@fashionreels",
    cat: "Fashion",
    query: "fashion lookbook reel",
  },
  {
    ytId: "nfWlot6h_JM",
    title: "Cafe Hopping Reel",
    creator: "@cafehoppers",
    cat: "Food",
    query: "cafe hopping reel",
  },
  {
    ytId: "kXYiU_JCYtU",
    title: "Night Out Reel",
    creator: "@nightout.vibes",
    cat: "Lifestyle",
    query: "night out reel aesthetic",
  },
  {
    ytId: "RgKAFK5djSk",
    title: "Tribute Reel — Feel Good",
    creator: "@feelgoodclips",
    cat: "Lifestyle",
    query: "feel good tribute reel",
  },
  {
    ytId: "dQw4w9WgXcQ",
    title: "Throwback Aesthetic Reel",
    creator: "@throwbackreels",
    cat: "Nostalgic",
    query: "throwback aesthetic reel",
  },
  {
    ytId: "72UO0y_SHws",
    title: "Hiking Adventure Reel",
    creator: "@hikingadventure",
    cat: "Nature",
    query: "hiking adventure reel",
  },
  {
    ytId: "SlPhMPnQ58k",
    title: "Golden Hour Portrait Reel",
    creator: "@portraitfilms",
    cat: "Photography",
    query: "golden hour portrait reel",
  },
  {
    ytId: "e-ORhEE9VVg",
    title: "Empowerment Reel",
    creator: "@empowerreels",
    cat: "Motivation",
    query: "empowerment women reel",
  },
  {
    ytId: "ru0K8uYEZWw",
    title: "Workout Glow Up Reel",
    creator: "@glowupreels",
    cat: "Fitness",
    query: "workout glow up reel",
  },
  {
    ytId: "pRpeEdMmmQ0",
    title: "Sports Highlights Reel",
    creator: "@sportsreels",
    cat: "Sports",
    query: "sports highlight reel",
  },
  {
    ytId: "fRh_vgS2dFE",
    title: "Summer Glow Reel",
    creator: "@summerglow",
    cat: "Lifestyle",
    query: "summer glow reel",
  },
];

// Facebook Reels skin — family, community, feel-good, DIY
const FB_POOL = [
  {
    ytId: "9bZkp7q19f0",
    title: "Kids Dance Party",
    creator: "@familyfun",
    cat: "Family",
    query: "kids dance party fun",
  },
  {
    ytId: "kffacxfA7G4",
    title: "Grandkids First Dance",
    creator: "@grandparent",
    cat: "Family",
    query: "grandkids wholesome moments",
  },
  {
    ytId: "pRpeEdMmmQ0",
    title: "Community Soccer Highlights",
    creator: "@communityfc",
    cat: "Sports",
    query: "community soccer highlights",
  },
  {
    ytId: "YQHsXMglC9A",
    title: "Wedding Surprise Moment",
    creator: "@weddingmoments",
    cat: "Weddings",
    query: "wedding surprise emotional",
  },
  {
    ytId: "RgKAFK5djSk",
    title: "Tribute to Friends — Friendship Goals",
    creator: "@friendsforever",
    cat: "Friendship",
    query: "friendship tribute feel good",
  },
  {
    ytId: "2Vv-BfVoq4g",
    title: "Perfect Proposal Video",
    creator: "@romanticmoments",
    cat: "Romance",
    query: "marriage proposal perfect",
  },
  {
    ytId: "SlPhMPnQ58k",
    title: "Cooking Together — Family Recipes",
    creator: "@homecooking",
    cat: "Food",
    query: "family cooking recipes",
  },
  {
    ytId: "iS1g8G_njx8",
    title: "Backyard Garden Makeover",
    creator: "@gardeningwithus",
    cat: "DIY",
    query: "backyard garden makeover",
  },
  {
    ytId: "hT_nvWreIhg",
    title: "Youth Team Training Day",
    creator: "@youthcoach",
    cat: "Sports",
    query: "youth sports training day",
  },
  {
    ytId: "ru0K8uYEZWw",
    title: "Neighbourhood Cleanup Drive",
    creator: "@communityheroes",
    cat: "Community",
    query: "neighbourhood cleanup drive",
  },
  {
    ytId: "e-ORhEE9VVg",
    title: "Empowering Women — Local Stories",
    creator: "@localheroes",
    cat: "Community",
    query: "women empowerment community",
  },
  {
    ytId: "60ItHLz5WEA",
    title: "Road Trip with the Family",
    creator: "@familyroads",
    cat: "Travel",
    query: "family road trip moments",
  },
  {
    ytId: "tgbNymZ7vqY",
    title: "Beach Day with Kids",
    creator: "@beachfamily",
    cat: "Family",
    query: "beach day kids family fun",
  },
  {
    ytId: "IcrbM1l_BoI",
    title: "Festival Day Out — Community Fair",
    creator: "@communityfair",
    cat: "Community",
    query: "community festival fair",
  },
  {
    ytId: "OkGOOmv_Hjo",
    title: "Local Talent Show Highlights",
    creator: "@localtalent",
    cat: "Entertainment",
    query: "local talent show community",
  },
  {
    ytId: "bo_efYLyVmo",
    title: "Summer BBQ Party Moments",
    creator: "@bbqparty",
    cat: "Food",
    query: "summer bbq party fun",
  },
  {
    ytId: "uelHwf8o7_U",
    title: "Friends Reunion Video",
    creator: "@reunionvibes",
    cat: "Friendship",
    query: "friends reunion emotional",
  },
  {
    ytId: "fRh_vgS2dFE",
    title: "Baby's First Steps",
    creator: "@babymilestones",
    cat: "Family",
    query: "baby first steps milestone",
  },
  {
    ytId: "nfWlot6h_JM",
    title: "Grandmother Dancing Goes Viral",
    creator: "@wholesomeclips",
    cat: "Wholesome",
    query: "grandmother dancing viral",
  },
  {
    ytId: "lp-EO5I60KA",
    title: "Father Son Bonding Moments",
    creator: "@dadlife",
    cat: "Family",
    query: "father son bonding moments",
  },
  {
    ytId: "72UO0y_SHws",
    title: "Hiking with the Crew",
    creator: "@hikingcrew",
    cat: "Outdoors",
    query: "hiking group friends fun",
  },
  {
    ytId: "dQw4w9WgXcQ",
    title: "Surprise Birthday Party",
    creator: "@birthdayclips",
    cat: "Celebrations",
    query: "surprise birthday party",
  },
  {
    ytId: "kXYiU_JCYtU",
    title: "School Play Performance",
    creator: "@schoolplay",
    cat: "Education",
    query: "school play performance",
  },
  {
    ytId: "7wtfhZwyrcc",
    title: "Dog Tricks Going Viral",
    creator: "@dogtrainer",
    cat: "Pets",
    query: "dog tricks viral video",
  },
  {
    ytId: "09R8_2nJtjg",
    title: "Sweet Surprise for Parents",
    creator: "@familylove",
    cat: "Family",
    query: "sweet surprise parents",
  },
];

// Snapchat Spotlight skin — sports, nature, extreme, cinematic
const SC_POOL = [
  {
    ytId: "tgbNymZ7vqY",
    title: "Surf Session at Golden Hour",
    creator: "@surfculture",
    cat: "Surf",
    query: "surf golden hour spotlight",
  },
  {
    ytId: "9bZkp7q19f0",
    title: "Skate Park Edit",
    creator: "@skateclips",
    cat: "Skate",
    query: "skate park edit viral",
  },
  {
    ytId: "kffacxfA7G4",
    title: "Cute Moments Compilation",
    creator: "@cutecompilation",
    cat: "Wholesome",
    query: "cute moments compilation",
  },
  {
    ytId: "60ItHLz5WEA",
    title: "Mountain Bike Trails Edit",
    creator: "@mtbculture",
    cat: "MTB",
    query: "mountain bike trail edit",
  },
  {
    ytId: "IcrbM1l_BoI",
    title: "Festival Music Clip",
    creator: "@livemusic",
    cat: "Music",
    query: "festival music outdoor",
  },
  {
    ytId: "hT_nvWreIhg",
    title: "Stargazing Time-Lapse",
    creator: "@nightsky",
    cat: "Nature",
    query: "stargazing time lapse",
  },
  {
    ytId: "H5v3kku4y6Q",
    title: "Gym Beast Mode Edit",
    creator: "@gymrats",
    cat: "Fitness",
    query: "gym beast mode training",
  },
  {
    ytId: "iS1g8G_njx8",
    title: "Cinematic Sunrise Hike",
    creator: "@hikingcinema",
    cat: "Nature",
    query: "cinematic sunrise hike",
  },
  {
    ytId: "2Vv-BfVoq4g",
    title: "Drone Landscape Reel",
    creator: "@droneshots",
    cat: "Aerial",
    query: "drone landscape cinematic",
  },
  {
    ytId: "7wtfhZwyrcc",
    title: "Levitating Dance Gym Edit",
    creator: "@gymdance",
    cat: "Dance",
    query: "gym dance edit spotlight",
  },
  {
    ytId: "kXYiU_JCYtU",
    title: "Parkour City Run",
    creator: "@parkourlife",
    cat: "Extreme",
    query: "parkour city freerun",
  },
  {
    ytId: "OkGOOmv_Hjo",
    title: "Night City Cinematic Walk",
    creator: "@cinemastreet",
    cat: "Urban",
    query: "night city cinematic walk",
  },
  {
    ytId: "uelHwf8o7_U",
    title: "Stay Chill Outdoor Edit",
    creator: "@outdoorvibes",
    cat: "Outdoors",
    query: "chill outdoor nature edit",
  },
  {
    ytId: "SlPhMPnQ58k",
    title: "Long Board Sunset Cruise",
    creator: "@longboardlife",
    cat: "Skate",
    query: "longboard sunset cruise",
  },
  {
    ytId: "JGwWNGJdvx8",
    title: "Kayaking Adventure Clip",
    creator: "@kayaklife",
    cat: "Water",
    query: "kayaking adventure water",
  },
  {
    ytId: "dQw4w9WgXcQ",
    title: "Epic Fail Compilation",
    creator: "@failclips",
    cat: "Comedy",
    query: "epic fail compilation snap",
  },
  {
    ytId: "CevxZvSJLk8",
    title: "Waterfall Hike Edit",
    creator: "@waterfalltrails",
    cat: "Nature",
    query: "waterfall hike nature edit",
  },
  {
    ytId: "bo_efYLyVmo",
    title: "Camping Fire Night Reel",
    creator: "@campfire.edits",
    cat: "Camping",
    query: "camping fire night reel",
  },
  {
    ytId: "ru0K8uYEZWw",
    title: "Fight Night Training Clip",
    creator: "@fighttraining",
    cat: "Boxing",
    query: "boxing training fight clip",
  },
  {
    ytId: "lp-EO5I60KA",
    title: "Rap Battle Street Clip",
    creator: "@streetculture",
    cat: "Hip-Hop",
    query: "rap battle street hip hop",
  },
  {
    ytId: "e-ORhEE9VVg",
    title: "Yoga at Sunrise",
    creator: "@sunriseyoga",
    cat: "Yoga",
    query: "sunrise yoga outdoor",
  },
  {
    ytId: "pRpeEdMmmQ0",
    title: "Soccer Tricks Street Edit",
    creator: "@streetfootball",
    cat: "Soccer",
    query: "soccer street tricks edit",
  },
  {
    ytId: "nfWlot6h_JM",
    title: "Snow Day Snowboard Edit",
    creator: "@snowboardlife",
    cat: "Snow",
    query: "snowboard day edit",
  },
  {
    ytId: "fRh_vgS2dFE",
    title: "Street Photography Walk Edit",
    creator: "@streetphotos",
    cat: "Photography",
    query: "street photography edit",
  },
  {
    ytId: "YQHsXMglC9A",
    title: "Acoustic Rooftop Session",
    creator: "@rooftopmusic",
    cat: "Music",
    query: "rooftop acoustic session",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM SKINS — branding applied over YouTube iframes
// ─────────────────────────────────────────────────────────────────────────────
const SKINS = {
  youtube: {
    barColor: "#FF0000",
    accent: "#FF0000",
    badgeLabel: "Shorts",
    icon: "▶",
    followLabel: ["Subscribe", "Subscribed"],
    followBg: ["#FF0000", "transparent"],
    followBorder: "#FF0000",
    followColor: ["#fff", "#FF0000"],
    openLabel: "▶ Watch on YouTube Shorts",
    openHref: (v) => `https://www.youtube.com/shorts/${v.ytId}`,
    openBg: "#FF0000",
    openColor: "#fff",
    avatarBg: "#FF0000",
  },
  tiktok: {
    barColor: "linear-gradient(90deg,#69C9D0,#EE1D52,#69C9D0)",
    accent: "#EE1D52",
    badgeLabel: "TikTok",
    icon: "♪",
    followLabel: ["Follow", "Following"],
    followBg: ["linear-gradient(90deg,#EE1D52,#69C9D0)", "transparent"],
    followBorder: "#EE1D52",
    followColor: ["#fff", "#EE1D52"],
    openLabel: "♪ Watch on TikTok",
    openHref: (v) =>
      `https://www.tiktok.com/search?q=${encodeURIComponent(v.query || v.title)}`,
    openBg: "linear-gradient(90deg,#EE1D52,#69C9D0)",
    openColor: "#fff",
    avatarBg: "linear-gradient(135deg,#69C9D0,#EE1D52)",
  },
  instagram: {
    barColor: "linear-gradient(90deg,#833ab4,#fd1d1d,#fcb045)",
    accent: "#E1306C",
    badgeLabel: "Reels",
    icon: "◎",
    followLabel: ["Follow", "Following"],
    followBg: ["linear-gradient(45deg,#f09433,#dc2743,#bc1888)", "transparent"],
    followBorder: "#dc2743",
    followColor: ["#fff", "#dc2743"],
    openLabel: "◎ Open Instagram Reels",
    openHref: (v) =>
      `https://www.instagram.com/reels/audio/?q=${encodeURIComponent(v.query || v.title)}`,
    openBg: "linear-gradient(45deg,#f09433,#dc2743,#bc1888)",
    openColor: "#fff",
    avatarBg: "linear-gradient(45deg,#833ab4,#fd1d1d)",
  },
  facebook: {
    barColor: "linear-gradient(90deg,#1877F2,#0b4f9e)",
    accent: "#1877F2",
    badgeLabel: "Reels",
    icon: "f",
    followLabel: ["+ Follow", "Following"],
    followBg: ["#1877F2", "transparent"],
    followBorder: "#1877F2",
    followColor: ["#fff", "#1877F2"],
    openLabel: "f Open Facebook Reels",
    openHref: (v) =>
      `https://www.facebook.com/search/videos/?q=${encodeURIComponent(v.query || v.title)}`,
    openBg: "#1877F2",
    openColor: "#fff",
    avatarBg: "#1877F2",
  },
  snapchat: {
    barColor: "#FFFC00",
    accent: "#FFFC00",
    badgeLabel: "Spotlight",
    icon: "◌",
    followLabel: ["+ Add", "Added"],
    followBg: ["#FFFC00", "transparent"],
    followBorder: "#FFFC00",
    followColor: ["#000", "#FFFC00"],
    openLabel: "👻 Open Snapchat Spotlight",
    openHref: () => `https://www.snapchat.com/spotlight`,
    openBg: "#FFFC00",
    openColor: "#000",
    avatarBg: "#FFFC00",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM META (sidebar + now-bar)
// ─────────────────────────────────────────────────────────────────────────────
const PLAT_META = {
  youtube: { color: "#FF0000", icon: "▶" },
  tiktok: { color: "#69C9D0", icon: "♪" },
  instagram: { color: "#E1306C", icon: "◎" },
  facebook: { color: "#1877F2", icon: "f" },
  snapchat: { color: "#FFFC00", icon: "◌" },
};

const SIDEBAR_BTNS = [
  { id: "all", icon: "⬡", color: "#a855f7" },
  { id: "youtube", icon: "▶", color: "#FF0000" },
  { id: "tiktok", icon: "♪", color: "#69C9D0" },
  { id: "instagram", icon: "◎", color: "#E1306C" },
  { id: "facebook", icon: "f", color: "#1877F2" },
  { id: "snapchat", icon: "◌", color: "#FFFC00" },
];

const CATS = [
  "For You",
  "Trending",
  "Music",
  "Gaming",
  "Comedy",
  "Food",
  "Tech",
  "Sports",
  "Travel",
  "Art",
  "Fitness",
];

// ─────────────────────────────────────────────────────────────────────────────
// POOL ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const _pools = {
  youtube: shuffle(YT_POOL.map((v) => ({ ...v, platform: "youtube" }))),
  tiktok: shuffle(TT_POOL.map((v) => ({ ...v, platform: "tiktok" }))),
  instagram: shuffle(IG_POOL.map((v) => ({ ...v, platform: "instagram" }))),
  facebook: shuffle(FB_POOL.map((v) => ({ ...v, platform: "facebook" }))),
  snapchat: shuffle(SC_POOL.map((v) => ({ ...v, platform: "snapchat" }))),
};
const _ptr = { youtube: 0, tiktok: 0, instagram: 0, facebook: 0, snapchat: 0 };

function nextItem(pid) {
  const pool = _pools[pid];
  if (_ptr[pid] >= pool.length) {
    _pools[pid] = shuffle(shuffle([...pool]));
    _ptr[pid] = 0;
  }
  return pool[_ptr[pid]++];
}

// 15-item feed cycling all 5 platforms
function buildFeed(batchNum = 0) {
  const pattern = [
    "youtube",
    "tiktok",
    "instagram",
    "youtube",
    "facebook",
    "youtube",
    "snapchat",
    "tiktok",
    "instagram",
    "youtube",
    "facebook",
    "youtube",
    "snapchat",
    "tiktok",
    "instagram",
  ];
  return pattern.map((pid, i) => {
    const item = nextItem(pid);
    return { ...item, uid: `b${batchNum}-${i}-${item.ytId}-${Date.now()}` };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
.sv-portal{position:fixed;inset:0;z-index:9999;display:flex;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;overflow:hidden}
.sv-sidebar{width:60px;flex-shrink:0;background:#0a0a0a;border-right:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:6px;z-index:10}
.sv-sbtn{width:44px;height:44px;border-radius:12px;border:1.5px solid transparent;background:rgba(255,255,255,.05);color:#555;font-size:16px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;outline:none}
.sv-sbtn:hover{opacity:.85}
.sv-feed-area{flex:1;position:relative;overflow:hidden;display:flex;flex-direction:column}
.sv-scroll{flex:1;overflow-y:scroll;scroll-snap-type:y mandatory}
.sv-scroll::-webkit-scrollbar{display:none}
.sv-slide{height:100vh;width:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;flex-shrink:0}
.sv-cats{position:absolute;top:0;left:0;right:0;z-index:20;padding:10px 12px 20px;background:linear-gradient(to bottom,rgba(0,0,0,.9) 0%,transparent 100%);pointer-events:none}
.sv-cats-row{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;pointer-events:all}
.sv-cats-row::-webkit-scrollbar{display:none}
.sv-cbt{padding:5px 14px;border-radius:20px;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all .18s;outline:none}
.sv-cbt-on{background:linear-gradient(90deg,#7c3aed,#db2777);color:#fff;border:none;box-shadow:0 0 14px rgba(124,58,237,.45)}
.sv-cbt-off{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.15)}
.sv-actions{position:absolute;right:12px;bottom:120px;z-index:30;display:flex;flex-direction:column;align-items:center;gap:16px}
.sv-ac{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer}
.sv-circle{width:46px;height:46px;border-radius:50%;background:rgba(0,0,0,.52);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;font-size:20px;border:1.5px solid rgba(255,255,255,.15);transition:all .2s}
.sv-circle:hover{transform:scale(1.08)}
.sv-albl{font-size:10px;color:rgba(255,255,255,.72);font-weight:600}
.sv-follow{border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;border:2px solid;font-family:inherit;transition:all .2s;outline:none;white-space:nowrap}
.sv-openlink{display:inline-flex;align-items:center;gap:5px;padding:8px 18px;border-radius:999px;border:none;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:.02em;text-decoration:none;transition:all .2s}
.sv-openlink:hover{opacity:.85;transform:translateY(-1px)}
.sv-heart{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:96px;pointer-events:none;z-index:40;animation:svheart .9s ease-out forwards}
.sv-hint{position:absolute;bottom:72px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;animation:svpulse 2s ease-in-out infinite;z-index:5}
.sv-dots{position:absolute;right:5px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:4px;z-index:20;max-height:40vh;overflow:hidden}
.sv-dot{border-radius:4px;cursor:pointer;transition:all .2s}
.sv-nowbar{position:absolute;bottom:0;left:0;right:0;z-index:20;pointer-events:none}
.sv-nowinner{max-width:480px;margin:0 auto;background:rgba(6,4,14,.9);backdrop-filter:blur(20px);border-radius:10px 10px 0 0;padding:7px 14px;display:flex;align-items:center;gap:9px}
.sv-loader{height:80px;display:flex;align-items:center;justify-content:center}
.sv-spinner{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.08);border-top-color:#7c3aed;animation:svspin .8s linear infinite}
.sv-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700}
.sv-sound-btn{position:absolute;top:14px;right:14px;z-index:35;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.65);backdrop-filter:blur(12px);border:1.5px solid rgba(255,255,255,.25);color:#fff;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;outline:none;box-shadow:0 2px 12px rgba(0,0,0,.5)}
.sv-sound-btn:hover{background:rgba(255,255,255,.18);transform:scale(1.1)}
@keyframes svheart{0%{transform:scale(.4);opacity:1}55%{transform:scale(1.4);opacity:1}100%{transform:scale(1.9);opacity:0}}
@keyframes svpulse{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes svspin{to{transform:rotate(360deg)}}
`;

// ─────────────────────────────────────────────────────────────────────────────
// ACTION BAR
// ─────────────────────────────────────────────────────────────────────────────
function Actions({
  liked,
  saved,
  likes,
  comments,
  shares,
  color,
  onLike,
  onSave,
}) {
  const fmt = (l) =>
    typeof l === "string" && l.length > 7 ? l.slice(0, 5) + "…" : l;
  return (
    <div className="sv-actions">
      {[
        {
          icon: liked ? "❤️" : "🤍",
          label: likes,
          active: liked,
          fn: (e) => {
            e.stopPropagation();
            onLike();
          },
        },
        {
          icon: "💬",
          label: comments,
          active: false,
          fn: (e) => e.stopPropagation(),
        },
        {
          icon: "↗️",
          label: shares,
          active: false,
          fn: (e) => e.stopPropagation(),
        },
        {
          icon: saved ? "🔖" : "📌",
          label: "Save",
          active: saved,
          fn: (e) => {
            e.stopPropagation();
            onSave();
          },
        },
      ].map(({ icon, label, active, fn }) => (
        <div key={icon} className="sv-ac" onClick={fn}>
          <div
            className="sv-circle"
            style={{
              background: active ? `${color}33` : "rgba(0,0,0,.52)",
              border: active
                ? `1.5px solid ${color}`
                : "1.5px solid rgba(255,255,255,.15)",
              transform: active ? "scale(1.1)" : "scale(1)",
            }}
          >
            {icon}
          </div>
          <span className="sv-albl">{fmt(label)}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM CARD — real YouTube iframe + platform skin overlay
// ─────────────────────────────────────────────────────────────────────────────
function PlatformCard({ video, isActive, muted, onToggleSound }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [follow, setFollow] = useState(false);
  const [heart, setHeart] = useState(false);
  const iframeRef = useRef(null);
  const loadedRef = useRef(false);
  const lastTap = useRef(0);
  const isActiveRef = useRef(isActive);
  const mutedRef = useRef(muted);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const skin = SKINS[video.platform] || SKINS.youtube;

  const postMsg = useCallback((cmd) => {
    const f = iframeRef.current;
    if (f && loadedRef.current) f.contentWindow.postMessage(cmd, "*");
  }, []);

  const applyState = useCallback(
    (active, m) => {
      if (active) {
        postMsg('{"event":"command","func":"playVideo","args":""}');
        postMsg(
          m
            ? '{"event":"command","func":"mute","args":""}'
            : '{"event":"command","func":"unMute","args":""}',
        );
        if (!m) postMsg('{"event":"command","func":"setVolume","args":[100]}');
      } else {
        postMsg('{"event":"command","func":"pauseVideo","args":""}');
        postMsg('{"event":"command","func":"mute","args":""}');
      }
    },
    [postMsg],
  );

  const handleLoad = useCallback(() => {
    loadedRef.current = true;
    applyState(isActiveRef.current, mutedRef.current);
  }, [applyState]);

  useEffect(() => {
    if (!loadedRef.current) return;
    applyState(isActive, muted);
  }, [isActive, muted, applyState]);

  const toggleSound = useCallback(
    (e) => {
      e.stopPropagation();
      if (!loadedRef.current) return;
      onToggleSound();
      if (!muted) {
        postMsg('{"event":"command","func":"mute","args":""}');
      } else {
        postMsg('{"event":"command","func":"unMute","args":""}');
        postMsg('{"event":"command","func":"setVolume","args":[100]}');
      }
    },
    [muted, onToggleSound, postMsg],
  );

  const tap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) setLiked(true);
      setHeart(true);
      setTimeout(() => setHeart(false), 900);
    }
    lastTap.current = now;
  };

  const src = `https://www.youtube.com/embed/${video.ytId}?autoplay=1&mute=1&loop=1&playlist=${video.ytId}&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;

  return (
    <div
      onClick={tap}
      style={{
        width: "100%",
        height: "100%",
        background: "#000",
        position: "relative",
      }}
    >
      {heart && <div className="sv-heart">❤️</div>}

      {/* Platform colour top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: skin.barColor,
          zIndex: 20,
        }}
      />

      {/* Sound toggle */}
      <button
        className="sv-sound-btn"
        onClick={toggleSound}
        title={muted ? "Turn on sound" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Real YouTube iframe — plays actual video */}
      <iframe
        ref={iframeRef}
        src={src}
        onLoad={handleLoad}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          zIndex: 1,
        }}
      />

      {/* Platform badge top-left */}
      <div style={{ position: "absolute", top: 16, left: 14, zIndex: 20 }}>
        <div
          className="sv-badge"
          style={{ border: `1px solid ${skin.accent}55`, color: "#fff" }}
        >
          <span style={{ color: skin.accent, fontSize: 13 }}>{skin.icon}</span>
          <span>{skin.badgeLabel}</span>
        </div>
      </div>

      {/* Bottom info overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background:
            "linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.55) 45%,transparent 100%)",
          padding: "0 14px 18px",
        }}
      >
        {/* Creator row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 7,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: skin.avatarBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              flexShrink: 0,
              border: "2px solid rgba(255,255,255,.25)",
            }}
          >
            {skin.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {video.creator}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>
              {video.cat}
            </div>
          </div>
          <button
            className="sv-follow"
            onClick={(e) => {
              e.stopPropagation();
              setFollow((f) => !f);
            }}
            style={{
              background: follow ? skin.followBg[1] : skin.followBg[0],
              borderColor: skin.followBorder,
              color: follow ? skin.followColor[1] : skin.followColor[0],
            }}
          >
            {follow ? skin.followLabel[1] : skin.followLabel[0]}
          </button>
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: 13,
            color: "#fff",
            margin: "0 0 10px",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {video.title}
        </p>

        {/* Open on platform button */}
        <a
          className="sv-openlink"
          href={skin.openHref(video)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ background: skin.openBg, color: skin.openColor }}
        >
          {skin.openLabel} ↗
        </a>
      </div>

      <Actions
        liked={liked}
        saved={saved}
        likes="142K"
        comments="8.4K"
        shares="21K"
        color={skin.accent}
        onLike={() => setLiked((l) => !l)}
        onSave={() => setSaved((s) => !s)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function ShortsVerse() {
  const navigate = useNavigate();
  const [platFilter, setPlatFilter] = useState("all");
  const [cat, setCat] = useState("For You");
  const [feed, setFeed] = useState(() => buildFeed(0));
  const [batchNum, setBatchNum] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [globalMuted, setGlobalMuted] = useState(true);
  const scrollRef = useRef(null);
  const observerRef = useRef(null);
  const slideRefs = useRef([]);

  useEffect(() => {
    if (document.getElementById("sv-style")) return;
    const s = document.createElement("style");
    s.id = "sv-style";
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") navigate(-1);
      if (
        (e.key === "ArrowDown" || e.key === "j") &&
        activeIdx < feed.length - 1
      )
        scrollToSlide(activeIdx + 1);
      if ((e.key === "ArrowUp" || e.key === "k") && activeIdx > 0)
        scrollToSlide(activeIdx - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIdx, feed.length, navigate]);

  const scrollToSlide = (idx) => {
    const el = slideRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.idx, 10);
            setActiveIdx(idx);
            if (idx >= feed.length - 3 && !loadingMore) loadMore();
            if (idx > 0) setShowHint(false);
          }
        });
      },
      { threshold: 0.6 },
    );
    slideRefs.current.forEach((el) => {
      if (el) observerRef.current.observe(el);
    });
    return () => observerRef.current.disconnect();
  }, [feed, loadingMore]);

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setFeed((prev) => [...prev, ...buildFeed(batchNum)]);
      setBatchNum((n) => n + 1);
      setLoadingMore(false);
    }, 600);
  };

  const visibleFeed =
    platFilter === "all" ? feed : feed.filter((v) => v.platform === platFilter);
  const toggleSound = () => setGlobalMuted((m) => !m);

  const portal = (
    <div className="sv-portal">
      {/* Sidebar */}
      <aside className="sv-sidebar">
        <button
          className="sv-sbtn"
          onClick={() => navigate(-1)}
          title="Exit"
          style={{ color: "#888", marginBottom: 8 }}
        >
          ✕
        </button>
        {SIDEBAR_BTNS.map((b) => (
          <button
            key={b.id}
            className="sv-sbtn"
            onClick={() => setPlatFilter(b.id)}
            title={b.id}
            style={{
              color: platFilter === b.id ? b.color : "#444",
              borderColor: platFilter === b.id ? b.color + "66" : "transparent",
              background:
                platFilter === b.id ? b.color + "14" : "rgba(255,255,255,.05)",
              boxShadow: platFilter === b.id ? `0 0 12px ${b.color}30` : "none",
            }}
          >
            {b.icon}
          </button>
        ))}
      </aside>

      {/* Feed */}
      <main className="sv-feed-area">
        {/* Category bar */}
        <div className="sv-cats">
          <div className="sv-cats-row">
            {CATS.map((c) => (
              <button
                key={c}
                className={`sv-cbt ${cat === c ? "sv-cbt-on" : "sv-cbt-off"}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Snap-scroll cards */}
        <div className="sv-scroll" ref={scrollRef}>
          {visibleFeed.map((video, i) => (
            <div
              key={video.uid}
              className="sv-slide"
              data-idx={i}
              ref={(el) => (slideRefs.current[i] = el)}
            >
              <PlatformCard
                video={video}
                isActive={i === activeIdx}
                muted={globalMuted}
                onToggleSound={toggleSound}
              />
            </div>
          ))}
          {loadingMore && (
            <div className="sv-loader">
              <div className="sv-spinner" />
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="sv-dots">
          {visibleFeed
            .slice(Math.max(0, activeIdx - 4), activeIdx + 5)
            .map((_, relI) => {
              const absI = Math.max(0, activeIdx - 4) + relI;
              return (
                <div
                  key={absI}
                  className="sv-dot"
                  onClick={() => scrollToSlide(absI)}
                  style={{
                    width: absI === activeIdx ? 4 : 3,
                    height: absI === activeIdx ? 18 : 8,
                    background:
                      absI === activeIdx ? "#a855f7" : "rgba(255,255,255,.25)",
                  }}
                />
              );
            })}
        </div>

        {/* Scroll hint */}
        {showHint && (
          <div className="sv-hint">
            <span style={{ fontSize: 18, color: "rgba(255,255,255,.5)" }}>
              ↕
            </span>
            <span
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,.35)",
                fontWeight: 600,
                letterSpacing: "0.1em",
              }}
            >
              SCROLL
            </span>
          </div>
        )}

        {/* Now-playing bar */}
        {visibleFeed[activeIdx] && (
          <div className="sv-nowbar">
            <div className="sv-nowinner">
              <span
                style={{
                  fontSize: 13,
                  color:
                    PLAT_META[visibleFeed[activeIdx].platform]?.color || "#fff",
                }}
              >
                {PLAT_META[visibleFeed[activeIdx].platform]?.icon}
              </span>
              <span
                style={{
                  flex: 1,
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: "rgba(255,255,255,.6)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {visibleFeed[activeIdx].title}
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>
                {activeIdx + 1}/{visibleFeed.length}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  return createPortal(portal, document.body);
}
