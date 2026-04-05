-- Nabu Flashcard System — Seed Data
-- Run after schema.sql

-- Arabic Essentials deck
INSERT INTO public.decks (id, title, description, source_language, target_language, share_code, is_public, card_count)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Arabic Essentials — 30 Words',
  'High-frequency Arabic vocabulary: nouns, verbs, adjectives, and common phrases.',
  'en', 'ar', 'ARABIC1', true, 30
);

-- Arabic cards (12 nouns, 8 verbs, 5 adjectives, 5 phrases)
INSERT INTO public.cards (deck_id, sort_order, word, translation, part_of_speech, example_sentence, explanation) VALUES
-- Nouns
('a0000000-0000-0000-0000-000000000001', 0, 'كِتَاب (kitāb)', 'book', 'noun', 'أَنَا أَقْرَأُ **كِتَابًا** جَدِيدًا', 'Masculine noun. Plural: كُتُب (kutub). One of the first words every Arabic learner should know.'),
('a0000000-0000-0000-0000-000000000001', 1, 'بَيْت (bayt)', 'house', 'noun', 'هَذَا **بَيْتُنَا** الجَدِيد', 'Masculine noun. Plural: بُيُوت (buyūt). Can also mean "home."'),
('a0000000-0000-0000-0000-000000000001', 2, 'مَاء (māʾ)', 'water', 'noun', 'أُرِيدُ **مَاءً** بَارِدًا', 'Masculine noun (irregular). Essential vocabulary for travel and daily life.'),
('a0000000-0000-0000-0000-000000000001', 3, 'طَعَام (ṭaʿām)', 'food', 'noun', 'هَذَا **الطَّعَامُ** لَذِيذ', 'Masculine noun. General word for food/meal.'),
('a0000000-0000-0000-0000-000000000001', 4, 'كَلْب (kalb)', 'dog', 'noun', 'رَأَيْتُ **كَلْبًا** فِي الشَّارِع', 'Masculine noun. Plural: كِلَاب (kilāb).'),
('a0000000-0000-0000-0000-000000000001', 5, 'قِطَّة (qiṭṭa)', 'cat', 'noun', '**القِطَّةُ** نَائِمَة عَلَى الأَرِيكَة', 'Feminine noun. Plural: قِطَط (qiṭaṭ).'),
('a0000000-0000-0000-0000-000000000001', 6, 'سَيَّارَة (sayyāra)', 'car', 'noun', 'اِشْتَرَيْتُ **سَيَّارَةً** جَدِيدَة', 'Feminine noun. From the root س-ي-ر (to travel/walk).'),
('a0000000-0000-0000-0000-000000000001', 7, 'مَدْرَسَة (madrasa)', 'school', 'noun', 'أَذْهَبُ إِلَى **المَدْرَسَةِ** كُلَّ يَوْم', 'Feminine noun. From the root د-ر-س (to study). Same root as "lesson" (دَرْس).'),
('a0000000-0000-0000-0000-000000000001', 8, 'صَدِيق (ṣadīq)', 'friend', 'noun', 'هَذَا **صَدِيقِي** مُحَمَّد', 'Masculine. Feminine: صَدِيقَة (ṣadīqa). Plural: أَصْدِقَاء (aṣdiqāʾ).'),
('a0000000-0000-0000-0000-000000000001', 9, 'يَوْم (yawm)', 'day', 'noun', 'كَانَ **يَوْمًا** جَمِيلًا', 'Masculine noun. Plural: أَيَّام (ayyām). Dual: يَوْمَان (yawmān).'),
('a0000000-0000-0000-0000-000000000001', 10, 'لَيْلَة (layla)', 'night', 'noun', '**اللَّيْلَةُ** هَادِئَة جِدًّا', 'Feminine noun. Plural: لَيَالٍ (layālī). Also a common girls name.'),
('a0000000-0000-0000-0000-000000000001', 11, 'شَمْس (shams)', 'sun', 'noun', '**الشَّمْسُ** سَاطِعَة اليَوْم', 'Feminine noun (one of the few that is feminine without the ة ending).'),
-- Verbs
('a0000000-0000-0000-0000-000000000001', 12, 'كَتَبَ (kataba)', 'to write', 'verb', '**كَتَبَ** الطَّالِبُ رِسَالَة', 'Form I verb. Root: ك-ت-ب. Same root as كِتَاب (book) and مَكْتَبَة (library).'),
('a0000000-0000-0000-0000-000000000001', 13, 'قَرَأَ (qaraʾa)', 'to read', 'verb', '**قَرَأْتُ** الكِتَابَ كُلَّه', 'Form I verb. Root: ق-ر-أ. Related to القُرْآن (the Quran, "the recitation").'),
('a0000000-0000-0000-0000-000000000001', 14, 'ذَهَبَ (dhahaba)', 'to go', 'verb', '**ذَهَبْنَا** إِلَى السُّوق', 'Form I verb. Root: ذ-ه-ب. One of the most common verbs in daily Arabic.'),
('a0000000-0000-0000-0000-000000000001', 15, 'أَكَلَ (akala)', 'to eat', 'verb', '**أَكَلْتُ** الطَّعَامَ بِسُرْعَة', 'Form I verb. Root: أ-ك-ل. Noun form: أَكْل (eating/food).'),
('a0000000-0000-0000-0000-000000000001', 16, 'شَرِبَ (shariba)', 'to drink', 'verb', '**شَرِبْتُ** القَهْوَة صَبَاحًا', 'Form I verb. Root: ش-ر-ب. Noun form: شَرَاب (drink/beverage).'),
('a0000000-0000-0000-0000-000000000001', 17, 'تَكَلَّمَ (takallama)', 'to speak', 'verb', '**تَكَلَّمَ** المُعَلِّمُ بِالعَرَبِيَّة', 'Form V verb. Root: ك-ل-م. Related to كَلَام (speech) and كَلِمَة (word).'),
('a0000000-0000-0000-0000-000000000001', 18, 'عَرَفَ (ʿarafa)', 'to know', 'verb', 'أَنَا **أَعْرِفُ** هَذَا المَكَان', 'Form I verb. Root: ع-ر-ف. Also means "to recognize." Noun: مَعْرِفَة (knowledge).'),
('a0000000-0000-0000-0000-000000000001', 19, 'أَحَبَّ (aḥabba)', 'to love', 'verb', '**أُحِبُّ** اللُّغَةَ العَرَبِيَّة', 'Form IV verb. Root: ح-ب-ب. Noun: حُبّ (love). حَبِيبِي = my beloved.'),
-- Adjectives
('a0000000-0000-0000-0000-000000000001', 20, 'كَبِير (kabīr)', 'big/large', 'adjective', 'هَذَا بَيْتٌ **كَبِيرٌ** جِدًّا', 'Feminine: كَبِيرَة. Comparative: أَكْبَر (bigger/biggest).'),
('a0000000-0000-0000-0000-000000000001', 21, 'صَغِير (ṣaghīr)', 'small/young', 'adjective', 'عِنْدِي كَلْبٌ **صَغِيرٌ**', 'Feminine: صَغِيرَة. Opposite of كَبِير. Can mean "small" (size) or "young" (age).'),
('a0000000-0000-0000-0000-000000000001', 22, 'جَمِيل (jamīl)', 'beautiful', 'adjective', 'هَذَا مَكَانٌ **جَمِيلٌ**', 'Feminine: جَمِيلَة. Root: ج-م-ل. Related to جَمَال (beauty) and جَمَل (camel — considered beautiful).'),
('a0000000-0000-0000-0000-000000000001', 23, 'جَدِيد (jadīd)', 'new', 'adjective', 'اِشْتَرَيْتُ هَاتِفًا **جَدِيدًا**', 'Feminine: جَدِيدَة. Opposite: قَدِيم (old/ancient).'),
('a0000000-0000-0000-0000-000000000001', 24, 'سَعِيد (saʿīd)', 'happy', 'adjective', 'أَنَا **سَعِيدٌ** جِدًّا اليَوْم', 'Feminine: سَعِيدَة. Also used as a male name. Noun: سَعَادَة (happiness).'),
-- Phrases
('a0000000-0000-0000-0000-000000000001', 25, 'السَّلَامُ عَلَيْكُم (as-salāmu ʿalaykum)', 'peace be upon you (hello)', 'phrase', '**السَّلَامُ عَلَيْكُمْ**، كَيْفَ حَالُكُم؟', 'The standard Islamic/Arabic greeting. Response: وَعَلَيْكُم السَّلَام (wa-ʿalaykum as-salām).'),
('a0000000-0000-0000-0000-000000000001', 26, 'شُكْرًا (shukran)', 'thank you', 'phrase', '**شُكْرًا** جَزِيلًا عَلَى مُسَاعَدَتِك', 'The most common way to say thanks. شُكْرًا جَزِيلًا = thank you very much.'),
('a0000000-0000-0000-0000-000000000001', 27, 'مِنْ فَضْلِك (min faḍlik)', 'please', 'phrase', '**مِنْ فَضْلِكَ** أَعْطِنِي المَاء', 'Literally "from your grace." For female: مِنْ فَضْلِكِ.'),
('a0000000-0000-0000-0000-000000000001', 28, 'كَيْفَ حَالُك (kayfa ḥāluk)', 'how are you?', 'phrase', '**كَيْفَ حَالُكَ** يَا صَدِيقِي؟', 'Casual greeting. For female: كَيْفَ حَالُكِ. Response: بِخَيْر (well/fine).'),
('a0000000-0000-0000-0000-000000000001', 29, 'إِنْ شَاءَ اللّٰه (in shāʾ allāh)', 'God willing', 'phrase', 'سَأَذْهَبُ غَدًا **إِنْ شَاءَ اللّٰه**', 'Used when speaking about future plans or hopes. One of the most common phrases in Arabic-speaking world.');

-- German Basics deck
INSERT INTO public.decks (id, title, description, source_language, target_language, share_code, is_public, card_count)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'German Basics — 25 Words',
  'Essential German vocabulary for beginners: everyday nouns, verbs, and expressions.',
  'en', 'de', 'GERMAN1', true, 25
);

INSERT INTO public.cards (deck_id, sort_order, word, translation, part_of_speech, example_sentence, explanation) VALUES
('a0000000-0000-0000-0000-000000000002', 0, 'Haus', 'house', 'noun', 'Das **Haus** ist sehr groß', 'Neuter noun (das Haus). Plural: Häuser. Compound examples: Hausaufgabe (homework), Haustier (pet).'),
('a0000000-0000-0000-0000-000000000002', 1, 'Buch', 'book', 'noun', 'Ich lese ein **Buch** über Geschichte', 'Neuter noun (das Buch). Plural: Bücher. Note the umlaut in the plural.'),
('a0000000-0000-0000-0000-000000000002', 2, 'Wasser', 'water', 'noun', 'Kann ich bitte **Wasser** haben?', 'Neuter noun (das Wasser). No plural form in common usage.'),
('a0000000-0000-0000-0000-000000000002', 3, 'Hund', 'dog', 'noun', 'Der **Hund** spielt im Garten', 'Masculine noun (der Hund). Plural: Hunde. Diminutive: Hündchen.'),
('a0000000-0000-0000-0000-000000000002', 4, 'Katze', 'cat', 'noun', 'Die **Katze** schläft auf dem Sofa', 'Feminine noun (die Katze). Plural: Katzen. Male cat: Kater.'),
('a0000000-0000-0000-0000-000000000002', 5, 'Auto', 'car', 'noun', 'Mein **Auto** ist blau', 'Neuter noun (das Auto). Short for Automobil. Plural: Autos.'),
('a0000000-0000-0000-0000-000000000002', 6, 'Schule', 'school', 'noun', 'Die Kinder gehen in die **Schule**', 'Feminine noun (die Schule). Plural: Schulen. Schüler = student.'),
('a0000000-0000-0000-0000-000000000002', 7, 'Freund', 'friend (male)', 'noun', 'Das ist mein bester **Freund**', 'Masculine. Feminine: Freundin. Also means boyfriend/girlfriend in context.'),
('a0000000-0000-0000-0000-000000000002', 8, 'Stadt', 'city', 'noun', 'Berlin ist eine große **Stadt**', 'Feminine noun (die Stadt). Plural: Städte. Note the umlaut.'),
('a0000000-0000-0000-0000-000000000002', 9, 'Essen', 'food / to eat', 'noun', 'Das **Essen** schmeckt gut', 'Neuter noun when meaning "food" (das Essen). Also an infinitive verb meaning "to eat."'),
('a0000000-0000-0000-0000-000000000002', 10, 'sprechen', 'to speak', 'verb', 'Ich **spreche** ein bisschen Deutsch', 'Irregular verb. ich spreche, du sprichst, er spricht. Note the vowel change e→i.'),
('a0000000-0000-0000-0000-000000000002', 11, 'gehen', 'to go', 'verb', 'Wir **gehen** heute ins Kino', 'Irregular verb. Past: ging. Perfect: ist gegangen. One of the most common German verbs.'),
('a0000000-0000-0000-0000-000000000002', 12, 'kommen', 'to come', 'verb', 'Woher **kommst** du?', 'Irregular verb. Past: kam. Perfect: ist gekommen. "Woher kommst du?" = Where are you from?'),
('a0000000-0000-0000-0000-000000000002', 13, 'schreiben', 'to write', 'verb', 'Ich **schreibe** einen Brief', 'Irregular verb. Past: schrieb. Perfect: hat geschrieben.'),
('a0000000-0000-0000-0000-000000000002', 14, 'lesen', 'to read', 'verb', 'Er **liest** die Zeitung', 'Irregular verb. du liest, er liest (vowel change e→ie). Past: las.'),
('a0000000-0000-0000-0000-000000000002', 15, 'lernen', 'to learn', 'verb', 'Ich **lerne** Deutsch seit einem Jahr', 'Regular verb. Past: lernte. Perfect: hat gelernt.'),
('a0000000-0000-0000-0000-000000000002', 16, 'wissen', 'to know (a fact)', 'verb', 'Ich **weiß** nicht, wo er ist', 'Irregular. ich weiß, du weißt. Different from kennen (to know/be acquainted with).'),
('a0000000-0000-0000-0000-000000000002', 17, 'groß', 'big/tall', 'adjective', 'Das Haus ist sehr **groß**', 'Comparative: größer. Superlative: am größten. Can mean both "big" and "tall."'),
('a0000000-0000-0000-0000-000000000002', 18, 'klein', 'small/short', 'adjective', 'Das Kind ist noch **klein**', 'Opposite of groß. Comparative: kleiner. Can mean "small" or "short" (height).'),
('a0000000-0000-0000-0000-000000000002', 19, 'schön', 'beautiful/nice', 'adjective', 'Das Wetter ist heute **schön**', 'Very versatile word. Can mean beautiful, nice, pretty, fine. "Schön!" = Great!/Nice!'),
('a0000000-0000-0000-0000-000000000002', 20, 'gut', 'good/well', 'adjective', 'Das Essen war sehr **gut**', 'Irregular comparison: gut, besser, am besten. "Alles gut?" = Everything okay?'),
('a0000000-0000-0000-0000-000000000002', 21, 'neu', 'new', 'adjective', 'Ich habe ein **neues** Auto', 'Note the adjective ending changes with gender: neuer/neue/neues.'),
('a0000000-0000-0000-0000-000000000002', 22, 'Danke', 'thank you', 'phrase', '**Danke** für Ihre Hilfe!', '"Danke schön" or "Vielen Dank" for emphasis. Response: "Bitte" (you''re welcome).'),
('a0000000-0000-0000-0000-000000000002', 23, 'Bitte', 'please / you''re welcome', 'phrase', '**Bitte** schön!', 'Multi-purpose word: "please" (request), "you''re welcome" (response to thanks), "here you go" (handing something).'),
('a0000000-0000-0000-0000-000000000002', 24, 'Entschuldigung', 'excuse me / sorry', 'phrase', '**Entschuldigung**, wo ist der Bahnhof?', 'Formal. Informal: "'Tschuldigung" or "Sorry." Use to get attention or apologize.');
