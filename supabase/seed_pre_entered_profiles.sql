-- Seed script for pre-entered profiles
-- 10 male profiles and 10 female profiles

-- Clear existing data (optional - comment out if you want to keep existing)
-- TRUNCATE TABLE pre_entered_profiles CASCADE;

-- ============================================================================
-- FEMALE PROFILES (10)
-- ============================================================================

INSERT INTO pre_entered_profiles (name, age, gender, bio, photos, is_active, is_online) VALUES
(
  'Scarlett',
  31,
  'female',
  'I''m Scarlett, and I write sport and travel stories. Adventure is kind of part of my job. When I''m not writing, you''ll find me chasing sunsets and exploring new places. Looking for someone who shares my passion for life and adventure!',
  ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
  true,
  true
),
(
  'Emma',
  28,
  'female',
  'Fitness enthusiast and yoga instructor. I love early morning runs, healthy cooking, and spending weekends at the beach. Looking for someone who values health and wellness as much as I do.',
  ARRAY['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400'],
  true,
  false
),
(
  'Sophia',
  26,
  'female',
  'Art lover and coffee enthusiast. I spend my days painting and my evenings at local cafes. Looking for someone who appreciates art, good conversation, and the simple pleasures in life.',
  ARRAY['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
  true,
  true
),
(
  'Olivia',
  29,
  'female',
  'Marketing professional by day, bookworm by night. I love reading, trying new restaurants, and traveling. Always up for an adventure and great conversations.',
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
  true,
  false
),
(
  'Isabella',
  27,
  'female',
  'Music producer and DJ. I live for good beats, late nights, and creative energy. Looking for someone who can keep up with my rhythm and share in my passion for music.',
  ARRAY['https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400'],
  true,
  true
),
(
  'Ava',
  25,
  'female',
  'Graphic designer with a love for minimalism and clean aesthetics. I enjoy photography, hiking, and discovering hidden gems in the city. Looking for someone creative and adventurous.',
  ARRAY['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
  true,
  false
),
(
  'Mia',
  30,
  'female',
  'Chef and food blogger. I love experimenting with new recipes and sharing my culinary adventures. Looking for someone who appreciates good food and great company.',
  ARRAY['https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400'],
  true,
  true
),
(
  'Charlotte',
  24,
  'female',
  'Fashion stylist and trendsetter. I love expressing myself through fashion and helping others find their style. Looking for someone who appreciates creativity and self-expression.',
  ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400'],
  true,
  false
),
(
  'Amelia',
  32,
  'female',
  'Psychologist and wellness coach. I help people find balance and happiness in their lives. Looking for someone who values personal growth and meaningful connections.',
  ARRAY['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
  true,
  true
),
(
  'Harper',
  23,
  'female',
  'Student and part-time model. I love fashion, photography, and exploring new places. Looking for someone fun, spontaneous, and ready for adventures.',
  ARRAY['https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400', 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400'],
  true,
  false
);

-- ============================================================================
-- MALE PROFILES (10)
-- ============================================================================

INSERT INTO pre_entered_profiles (name, age, gender, bio, photos, is_active, is_online) VALUES
(
  'James',
  32,
  'male',
  'Software engineer and tech enthusiast. I love coding, gaming, and exploring new technologies. Looking for someone who shares my passion for innovation and good conversations.',
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
  true,
  true
),
(
  'Michael',
  29,
  'male',
  'Photographer and travel blogger. I capture moments and tell stories through my lens. Always on the move, looking for someone to share adventures with.',
  ARRAY['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
  true,
  false
),
(
  'David',
  35,
  'male',
  'Business consultant and entrepreneur. I love building things, whether it''s businesses or relationships. Looking for someone ambitious and driven.',
  ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
  true,
  true
),
(
  'Daniel',
  27,
  'male',
  'Musician and songwriter. Music is my life, and I love sharing it with others. Looking for someone who appreciates art, creativity, and deep conversations.',
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
  true,
  false
),
(
  'Matthew',
  31,
  'male',
  'Fitness trainer and nutrition coach. I help people transform their lives through health and fitness. Looking for someone who values a healthy lifestyle and personal growth.',
  ARRAY['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
  true,
  true
),
(
  'Christopher',
  28,
  'male',
  'Architect and design enthusiast. I create spaces that inspire and bring people together. Looking for someone who appreciates beauty, design, and thoughtful living.',
  ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
  true,
  false
),
(
  'Andrew',
  33,
  'male',
  'Chef and restaurant owner. Food is my passion, and I love creating memorable dining experiences. Looking for someone who appreciates good food and great company.',
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
  true,
  true
),
(
  'Joshua',
  26,
  'male',
  'Marketing director and creative strategist. I love brainstorming, building brands, and telling stories. Looking for someone creative, ambitious, and fun to be around.',
  ARRAY['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
  true,
  false
),
(
  'Ryan',
  30,
  'male',
  'Pilot and adventure seeker. I travel the world and love exploring new destinations. Looking for someone who shares my wanderlust and sense of adventure.',
  ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
  true,
  true
),
(
  'Tyler',
  24,
  'male',
  'Student and aspiring entrepreneur. I''m passionate about learning, growing, and building something meaningful. Looking for someone who shares my drive and positive energy.',
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
  true,
  false
);

-- Update last_seen for online profiles
UPDATE pre_entered_profiles 
SET last_seen = NOW() 
WHERE is_online = true;

