export const PLATFORMS = [
  { id: 'all', name: 'All Platforms', icon: '⬡', color: '#00d4ff', category: 'all' },
  { id: 'youtube', name: 'YouTube', icon: '▶', color: '#FF0000', category: 'video', desc: 'Videos · Shorts · Live · Channels', monthlyUsers: '2.7B' },
  { id: 'tiktok', name: 'TikTok', icon: '♪', color: '#69C9D0', category: 'short', desc: 'Short Videos · Live · Trends', monthlyUsers: '1.5B' },
  { id: 'instagram', name: 'Instagram', icon: '◎', color: '#E1306C', category: 'social', desc: 'Reels · Stories · Posts', monthlyUsers: '2.4B' },
  { id: 'facebook', name: 'Facebook', icon: 'f', color: '#1877F2', category: 'social', desc: 'Videos · Reels · Live', monthlyUsers: '3.0B' },
  { id: 'twitter', name: 'X / Twitter', icon: '✕', color: '#e7e7e7', category: 'social', desc: 'Video Tweets · Spaces · Clips', monthlyUsers: '550M' },
  { id: 'twitch', name: 'Twitch', icon: '◈', color: '#9146FF', category: 'live', desc: 'Live Streams · Clips · VODs', monthlyUsers: '140M' },
  { id: 'reddit', name: 'Reddit', icon: '◍', color: '#FF4500', category: 'community', desc: 'Video Posts · GIFs · Clips', monthlyUsers: '1.5B' },
  { id: 'vimeo', name: 'Vimeo', icon: '◐', color: '#1AB7EA', category: 'video', desc: 'HD Videos · Films · Portfolios', monthlyUsers: '300M' },
  { id: 'dailymotion', name: 'Dailymotion', icon: '◉', color: '#0066DC', category: 'video', desc: 'Videos · News · Entertainment', monthlyUsers: '300M' },
  { id: 'snapchat', name: 'Snapchat', icon: '◌', color: '#FFFC00', category: 'social', desc: 'Spotlight · Stories · Snaps', monthlyUsers: '750M' },
  { id: 'pinterest', name: 'Pinterest', icon: '⊕', color: '#E60023', category: 'visual', desc: 'Video Pins · Idea Boards', monthlyUsers: '465M' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: '#0A66C2', category: 'professional', desc: 'Video Posts · Learning · Live', monthlyUsers: '900M' },
  { id: 'rumble', name: 'Rumble', icon: 'R', color: '#85C742', category: 'video', desc: 'Videos · Live · Independent', monthlyUsers: '50M' },
  { id: 'odysee', name: 'Odysee', icon: '∞', color: '#EF1970', category: 'decentralized', desc: 'Blockchain · Independent', monthlyUsers: '30M' },
  { id: 'bilibili', name: 'Bilibili', icon: 'B', color: '#FB7299', category: 'video', desc: 'Anime · Gaming · Live', monthlyUsers: '300M' },
  { id: 'triller', name: 'Triller', icon: 'T', color: '#FF0069', category: 'short', desc: 'Music Videos · Short Clips', monthlyUsers: '65M' },
  { id: 'kwai', name: 'Kwai', icon: 'K', color: '#FF8200', category: 'short', desc: 'Short Videos · Fun · Viral', monthlyUsers: '200M' },
  { id: 'peertube', name: 'PeerTube', icon: 'P', color: '#F1680D', category: 'decentralized', desc: 'Federated · Open Source', monthlyUsers: '5M' },
];

export const PLATFORM_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Video' },
  { id: 'social', label: 'Social' },
  { id: 'short', label: 'Shorts & Reels' },
  { id: 'live', label: 'Live' },
  { id: 'community', label: 'Community' },
  { id: 'visual', label: 'Visual' },
  { id: 'professional', label: 'Professional' },
  { id: 'decentralized', label: 'Decentralized' },
];

export const CATEGORIES = [
  { label: '🔥 Trending', tag: 'trending' },
  { label: '🎵 Music', tag: 'music' },
  { label: '🎮 Gaming', tag: 'gaming' },
  { label: '📱 Shorts', tag: 'shorts' },
  { label: '🎬 Cinema', tag: 'movies' },
  { label: '🏆 Sports', tag: 'sports highlights' },
  { label: '🍕 Food', tag: 'food recipes' },
  { label: '✈️ Travel', tag: 'travel vlog' },
  { label: '💡 Tech', tag: 'technology review' },
  { label: '😂 Comedy', tag: 'comedy clips' },
  { label: '💪 Fitness', tag: 'workout fitness' },
  { label: '🎨 Art', tag: 'digital art' },
  { label: '🔬 Science', tag: 'science explained' },
  { label: '📰 News', tag: 'breaking news' },
  { label: '🐾 Animals', tag: 'cute animals' },
  { label: '🚗 Cars', tag: 'car review' },
  { label: '🌿 Nature', tag: 'nature documentary' },
  { label: '👗 Fashion', tag: 'fashion style' },
];

export const CONTENT_TYPES = [
  { id: 'all', label: 'All Content' },
  { id: 'videos', label: 'Videos' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'reels', label: 'Reels' },
  { id: 'live', label: 'Live' },
  { id: 'music', label: 'Music' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'tutorials', label: 'Tutorials' },
];

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Most Relevant' },
  { id: 'recent', label: 'Most Recent' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'users', label: 'By User Count' },
];
