-- La Union Tour - database setup (run once in MySQL Workbench as an admin user).
-- Creates the database, a dedicated app user, the tables, and seed data.

CREATE DATABASE IF NOT EXISTS launion_tour CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'launion_user'@'localhost' IDENTIFIED BY 'LaUnion2026!';
GRANT ALL PRIVILEGES ON launion_tour.* TO 'launion_user'@'localhost';
FLUSH PRIVILEGES;

USE launion_tour;

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS saved_items;
DROP TABLE IF EXISTS spots;
DROP TABLE IF EXISTS hotels;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS towns;

CREATE TABLE towns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  lat DECIMAL(8,4) NOT NULL,
  lng DECIMAL(8,4) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE spots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  town_id INT NOT NULL,
  category VARCHAR(40) NOT NULL,
  type VARCHAR(60) NOT NULL,
  about TEXT NOT NULL,
  location VARCHAR(255),
  price VARCHAR(60),
  hours VARCHAR(60),
  phone VARCHAR(60),
  email VARCHAR(160),
  image VARCHAR(255),
  CONSTRAINT fk_spot_town FOREIGN KEY (town_id) REFERENCES towns(id)
) ENGINE=InnoDB;

CREATE TABLE hotels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  town_id INT NOT NULL,
  type VARCHAR(60) NOT NULL,
  price INT NOT NULL,
  rating DECIMAL(2,1) NOT NULL,
  about TEXT NOT NULL,
  amenities VARCHAR(255),
  image VARCHAR(255),
  CONSTRAINT fk_hotel_town FOREIGN KEY (town_id) REFERENCES towns(id)
) ENGINE=InnoDB;

CREATE TABLE saved_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_type ENUM('spot','hotel') NOT NULL,
  item_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_saved (user_id, item_type, item_id),
  CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  kind ENUM('hotel','tour') NOT NULL,
  item_id INT NOT NULL,
  item_name VARCHAR(160) NOT NULL,
  town VARCHAR(80),
  checkin DATE,
  checkout DATE,
  guests INT,
  tour_date DATE,
  people INT,
  total INT,
  status ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Towns
INSERT INTO towns (id, name, lat, lng) VALUES (1, 'San Juan', 16.6759, 120.3319);
INSERT INTO towns (id, name, lat, lng) VALUES (2, 'San Fernando City', 16.6159, 120.3166);
INSERT INTO towns (id, name, lat, lng) VALUES (3, 'Luna', 16.85, 120.3833);
INSERT INTO towns (id, name, lat, lng) VALUES (4, 'Balaoan', 16.7833, 120.4);
INSERT INTO towns (id, name, lat, lng) VALUES (5, 'Bacnotan', 16.7237, 120.3567);
INSERT INTO towns (id, name, lat, lng) VALUES (6, 'Bauang', 16.5306, 120.3331);
INSERT INTO towns (id, name, lat, lng) VALUES (7, 'Agoo', 16.33, 120.3667);
INSERT INTO towns (id, name, lat, lng) VALUES (8, 'Caba', 16.4333, 120.35);
INSERT INTO towns (id, name, lat, lng) VALUES (9, 'Bangar', 16.9167, 120.4167);
INSERT INTO towns (id, name, lat, lng) VALUES (10, 'San Gabriel', 16.6833, 120.4333);
INSERT INTO towns (id, name, lat, lng) VALUES (11, 'Bagulin', 16.6, 120.4833);
INSERT INTO towns (id, name, lat, lng) VALUES (12, 'Sudipen', 16.9167, 120.45);
INSERT INTO towns (id, name, lat, lng) VALUES (13, 'Naguilian', 16.5333, 120.3833);
INSERT INTO towns (id, name, lat, lng) VALUES (14, 'Aringay', 16.3933, 120.3567);

-- Tourist spots
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Urbiztondo Beach', 1, 'beaches', 'Beach', 'The beating heart of La Union''s surf scene, ideal for beginners and seasoned surfers alike. Surf lessons run around the area with board rentals, plus a lively community of beachfront cafes and unforgettable sunset views.', 'MacArthur Highway, Urbiztondo, San Juan, 2514 La Union, Philippines', '200 - 400', 'Open 24/7', 'N/A', 'N/A', 'img/beach/urbiztondo.jpeg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Pebble Beach', 3, 'beaches', 'Beach', 'A unique beach covered with colorful pebbles, perfect for photography and exploring the nearby Baluarte Watch Tower, a 400-year-old Spanish-era fort just steps away.', 'Barrientos, Luna, 2518 La Union, Philippines', 'N/A', 'N/A', '0919 282 7646', 'pebblebeach@yahoo.com', 'img/beach/pebble-beach.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Immuki Island', 4, 'beaches', 'Beach', 'A rocky paradise with three lagoons suitable for swimming and cliff diving. Access requires registration at the barangay hall and a small environmental fee.', 'Balaoan, 2517 La Union, Philippines', '30 - 50', '6:00 AM - 6:00 PM', 'N/A', 'N/A', 'img/beach/immuki.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Tangadan Falls', 10, 'beaches', 'Waterfall', 'A two-tiered waterfall with the lower cascade as the main attraction. Around 40 feet high with a catch basin roughly 20 feet deep, where visitors can take the leap and go cliff jumping.', 'Amontoc, San Gabriel, 2513 La Union, Philippines', 'N/A', '6:00 AM - 5:00 PM', '0910 878 0521', 'N/A', 'img/beach/tangadan.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Taboc Beach', 1, 'beaches', 'Beach', 'A quieter alternative to Urbiztondo, great for peaceful walks, low-key wading, and overnight stays. It offers a more residential and relaxed vibe while still being close to San Juan''s amenities.', 'Taboc, San Juan, La Union, Philippines', 'Free', 'Open 24/7', 'N/A', 'N/A', 'img/beach/taboc.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Agoo Beach', 7, 'beaches', 'Beach', 'A serene beach with golden-grey sands and clear waters, perfect for swimming, beach volleyball, and relaxation. Famously lined with tall agoho trees that frame a scenic backdrop for sunsets, with Agoo Cathedral and Poro Point Lighthouse nearby.', 'Sta. Rita Central, Agoo, La Union, Philippines', '10 - 15', '6:00 AM - 6:00 PM', 'N/A', 'N/A', 'img/beach/agoo.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Darigayos Beach', 4, 'beaches', 'Beach', 'A serene coastal hideaway known for its long stretch of cream-colored sand, clear turquoise waters, and a curved cove that naturally calms the waves. Highly pet-friendly and a peaceful alternative for families.', 'Bacnotan-Luna-Balaoan Road, Almieda, Balaoan, 2517 La Union, Philippines', 'Free', 'Open 24/7', 'N/A', 'N/A', 'img/beach/darigayos.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Acapulco Beach', 2, 'beaches', 'Beach', 'A popular and highly accessible local beach with fine greyish-golden sand and generally calm waters. Favored by locals for budget-friendly family outings, weekend picnics, and open-air beach volleyball, all close to the city center.', 'San Francisco, San Fernando City, 2500 La Union, Philippines', 'Free', 'Open 24/7', '+63 72 242 5696', 'N/A', 'img/beach/acapulco.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Caba Beach', 8, 'beaches', 'Beach', 'A hidden coastal gem with pristine, peaceful stretches of golden-grey sand largely untouched by heavy tourism. A quiet sanctuary for solitude, long beach walks, low-key camping, and intimate sunset viewings.', 'Caba, La Union, Philippines', 'Free', 'Open 24/7', 'N/A', 'N/A', 'img/beach/caba-beach.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Bacnotan Beach', 5, 'beaches', 'Beach', 'A sprawling black-and-grey sand shoreline and an excellent, less crowded alternative to Urbiztondo for surfers, with its own reliable surf breaks (the local ''Carille'' break). Raw, authentic, and perfect for long walks and undisturbed sunsets.', 'Quirino, Bacnotan, 2515 La Union, Philippines', 'Free', 'Open 24/7', 'N/A', 'N/A', 'img/beach/bacnotan.avif');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Kedlap Burial Cave', 11, 'mountains', 'Cave', 'Declared a National Cultural Treasure in 1977, this deeply revered site features ancient hanging wooden coffins nestled into natural rock crevices. A shallow cave in Barangay Cambaly overlooking the northern mountains.', 'Tagudtud, Bagulin, 2512 La Union, Philippines', '200', '6:00 AM - 5:00 PM', '+63 72 242 5550', 'N/A', 'img/mountains/kudlap-burial-cave.jpeg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Mount Lusong', 9, 'mountains', 'Mountain', 'A hill with an elevation of roughly 267 meters (868 feet) near the village of Castro. The trail is a 6.7-mile out-and-back route with beautiful views, moderately challenging, taking about 3 to 3.5 hours to complete and open year-round.', 'Bangar, La Union, Philippines', '30', '6:00 AM - 5:00 PM', 'N/A', 'N/A', 'img/mountains/mount-lusong.jpeg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Mount Mugong', 10, 'mountains', 'Mountain', 'The highest peak in La Union, standing at approximately 1,419 meters above sea level. Known for stunning views and a difficulty rating of 4/9, making it suitable for active beginners with an ascent of about 1 to 3 hours.', 'Bayabas, San Gabriel, 2513 La Union, Philippines', 'Free', '7:00 AM - 8:00 PM', 'N/A', 'N/A', 'img/mountains/mount-mugong.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Sudipen Highland Crevices', 12, 'mountains', 'Cave', 'Small, ancient rock shelters tightly linked to the ancestral domains of northern La Union. Traditionally used as temporary hunting shelters by early tribal ancestors navigating the boundary ridges.', 'Sudipen, La Union, Philippines', '30', '6:00 AM - 5:00 PM', 'N/A', 'N/A', 'img/mountains/sudipen-highland-crevices.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Gefseis Greek Grill', 1, 'food', 'Restaurant', 'An authentic Greek restaurant serving traditional dishes like souvlaki and moussaka right on the shores of San Juan. Its iconic blue and white aesthetic delivers a Mediterranean dining experience with a beachfront view.', 'MacArthur Highway, Urbiztondo, San Juan, 2514 La Union, Philippines', '500 - 1,000', '9:00 AM - 10:00 PM', '+63 917 711 0419', 'gefseisgreekgrill@yahoo.com', 'img/food/greek.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Curo La Union', 1, 'food', 'Restaurant', 'Nestled inside Curbside Villa, this aesthetically pleasing restaurant serves modern comfort food and specialty coffee in a relaxed, minimalist atmosphere, perfect for unwinding after a day of surfing.', 'MacArthur Highway, Urbiztondo, San Juan, 2514 La Union, Philippines', '500 - 1,000', '7:00 AM - 9:00 PM', '+63 915 478 9690', 'reserve@curbsidevilla.com', 'img/food/curo.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Nuq Dining and Villas', 1, 'food', 'Restaurant', 'A premium beachfront dining destination elevating local ingredients into modern culinary creations, pairing a sophisticated menu with stunning architectural design and ocean views.', 'MacArthur Highway, Taboc, San Juan, 2514 La Union, Philippines', 'N/A', '11:00 AM - 10:00 PM', '+63 939 989 6164', 'nuqlaunionofficial@gmail.com', 'img/food/nuq.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Amare La Cucina', 2, 'food', 'Restaurant', 'Famous for traditional wood-fired brick oven pizzas and authentic Italian cuisine. Diners can enjoy an interactive experience by tossing their own pizza dough before it goes into the oven.', '277 MacArthur Highway, Carlatan, San Fernando City, 2500 La Union, Philippines', '500 - 1,000', '11:00 AM - 9:00 PM', '+63 917 721 2684', 'amaresanjuan@gmail.com', 'img/food/amare.webp');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Halo Halo de Iloko', 2, 'food', 'Restaurant', 'A renowned culinary landmark celebrating authentic Ilocano heritage dishes and locally crafted delicacies. Most famous for its signature Buko Halo-Halo, served in a rustic, antique-filled setting.', 'Pagdaraoan-Biday Road, Biday, San Fernando City, 2500 La Union, Philippines', '500 - 1,000', '9:00 AM - 9:00 PM', '+63 917 852 7919', 'N/A', 'img/food/halohalo.webp');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Natalna Grille', 2, 'food', 'Restaurant', 'A laid-back, open-air restaurant serving fresh seafood and classic Filipino grilled favorites by the beach. A local favorite for hearty meals while watching the sunset over the West Philippine Sea.', 'San Vicente Road, Pagudpud, San Fernando City, 2500 La Union, Philippines', '500 - 1,000', '11:00 AM - 9:00 PM', '+63 972 619 2846', 'N/A', 'img/food/natalna.webp');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Angel and Marie''s Surfer''s Retreat', 1, 'food', 'Restaurant', 'A cozy, budget-friendly staple in the San Juan surf scene serving hearty, home-style Filipino meals. A relaxed hangout spot for surfers and travelers to recharge.', 'National Road, Urbiztondo, San Juan, 2514 La Union, Philippines', 'N/A', '10:00 AM - 9:00 PM', '+63 917 723 3253', 'marie.aquino1981@gmail.com', 'img/food/angels.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Coast Call Kitchen & Bar', 1, 'food', 'Restaurant', 'Located within the San Juan Surf Resort, this bustling beachfront spot serves a diverse mix of Filipino favorites and Western comfort food. An iconic gathering place for breakfast or sunset drinks by the surf break.', 'MacArthur Highway, Urbiztondo, San Juan, 2514 La Union, Philippines', 'N/A', '6:30 AM - 10:00 PM', '+63 917 880 3040', 'info@coastcallsanjuan.com', 'img/food/coast-call.png');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Sun Set Bay Beach Resort & Restaurant', 2, 'food', 'Restaurant', 'A tranquil beachfront dining spot offering a mix of international and local dishes away from the busy surf crowds. A peaceful, family-friendly atmosphere with uninterrupted ocean views.', 'MacArthur Highway, San Nicolas, San Fernando City, La Union, Philippines', 'N/A', 'N/A', '+63 72 607 5970', 'info@sunsetbayphilippines.com', 'img/food/sunset.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('R Garage', 6, 'culture', 'Museum', 'A haven for automotive enthusiasts showcasing a well-preserved collection of classic cars, vintage motorcycles, and retro memorabilia. A nostalgic journey through automotive history in the heart of Bauang.', 'MacArthur Highway, Disso-or, Bauang, 2501 La Union, Philippines', '200 - 350', '9:00 AM - 6:00 PM', '+63 966 816 0100', 'rgaragelaunion@gmail.com', 'img/culture/r-garage.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Ma-Cho Temple', 2, 'culture', 'Religious Site', 'A stunning Taoist temple dedicated to Mazu, the Chinese goddess of the sea, with intricate architecture overlooking the West Philippine Sea. A peaceful sanctuary for worshippers and tourists seeking cultural enrichment and panoramic views.', 'Ma-Cho Temple Driveway, Barangay I, San Fernando City, 2500 La Union, Philippines', 'Free', '7:00 AM - 5:00 PM', '+63 72 242 2533', 'N/A', 'img/culture/ma-cho-temple.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Gapuz Grapes Farm', 6, 'culture', 'Farm', 'A pioneer in La Union''s agritourism, this vineyard lets visitors experience hands-on grape picking under the tropical sun. A unique, family-friendly activity where guests harvest and pay for their own fresh fruit.', 'MacArthur Highway, Bauang, 2501 La Union, Philippines', 'Free', '7:00 AM - 6:00 PM', '+63 915 778 4594', 'N/A', 'img/culture/gapuz-grapes-farm.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Baluarte Watch Tower', 3, 'culture', 'Historic Site', 'A restored Spanish-era watchtower standing proudly on a pebble beach, originally built to warn coastal communities of pirate attacks. Today a picturesque historical landmark with beautiful sunset views over the ocean.', 'Victoria, Luna, 2518 La Union, Philippines', 'Free', 'Open 24/7', 'N/A', 'N/A', 'img/culture/baluarte-watch-tower.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Kamay na Bato', 3, 'culture', 'Museum', 'An eclectic open-air art gallery featuring unique stone carvings, wooden sculptures, and 3D paintings by Korean sculptor Bong Kim. Near the coast, it transforms ordinary coastal stones into a whimsical exploration of culture and surrealism.', 'Nalvo Norte, Luna, 2518 La Union, Philippines', '30', '6:00 AM - 6:00 PM', '+63 912 672 6099', 'N/A', 'img/culture/kamay-na-bato.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Christ the Redeemer Statue', 2, 'culture', 'Monument', 'Atop Reservoir Hill, this towering 25-foot statue offers a quiet vantage point overlooking the bustling city of San Fernando and the sea. A spiritual landmark and popular destination for peaceful reflection and scenic sightseeing.', 'Lubrin Heights Road, Barangay I, San Fernando City, 2500 La Union, Philippines', 'Free', 'Open 24/7', '+63 917 684 2330', 'N/A', 'img/culture/christ-the-redeemer.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Basilica Minore of Our Lady of Charity', 7, 'culture', 'Religious Site', 'A majestic Mexican-Baroque basilica and prominent pilgrimage site housing the miraculous image of Our Lady of Charity. Its grand architecture and peaceful ambiance make it a significant spiritual and cultural landmark.', 'Dona Toribia Provincial Road, Consolacion, Agoo, 2504 La Union, Philippines', 'Free', '10:00 AM - 9:00 PM', '0927 196 5540', 'agoo.romancatholic@gmail.com', 'img/culture/basilica-minore-of-our-lady-of-charity.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('La Union Botanical Garden', 2, 'culture', 'Garden', 'Tucked in the mountainous terrain of San Fernando, this lush sanctuary features themed gardens showcasing native and exotic plant species. A refreshing, educational retreat for nature lovers escaping the coastal heat.', 'Cadaclan, San Fernando City, 2500 La Union, Philippines', 'N/A', '8:00 AM - 5:00 PM', 'N/A', 'N/A', 'img/culture/botanical-garden.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Poro Point Lighthouse', 2, 'culture', 'Lighthouse', 'Standing as a sentinel over San Fernando Bay, this historic lighthouse continues a legacy of guiding ships dating back to the Spanish colonial era. Its grounds offer expansive ocean views and a glimpse into maritime history.', 'Lighthouse Road, Poro, San Fernando City, 2500 La Union, Philippines', 'Free', 'Open 24/7', '+63 72 888 5956', 'poropointfreeportzone@gmail.com', 'img/culture/poro-point-lighthouse.jpg');
INSERT INTO spots (name, town_id, category, type, about, location, price, hours, phone, email, image) VALUES ('Pindangan Ruins', 2, 'culture', 'Historic Site', 'Moss-covered stone walls that are the remnants of an 18th-century Spanish church destroyed by a massive earthquake. The tranquil ruins are now a captivating historical site and a popular backdrop for photography.', 'San Vicente, San Fernando City, 2500 La Union, Philippines', '25', '6:00 AM - 5:00 PM', 'N/A', 'N/A', 'img/culture/pindangan-ruins.jpg');

-- Hotels (real La Union hotels, sample rates)
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('Puerto de San Juan Beach Resort', 1, 'Beach Resort', 4500, 4.2, 'La Union''s tall beachfront condotel in Urbiztondo, with sea-view rooms, a pool, and direct access to the surf.', 'Pool, Beachfront, Restaurant, Free WiFi, Parking', 'hotel/puerto.jpeg');
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('Awesome Hotel', 1, 'Beach Resort', 6000, 4.5, 'A modern luxury beach resort right on the Urbiztondo surf break, with a pool, rooftop, and full-service restaurant.', 'Pool, Beachfront, Restaurant, Bar, Free WiFi', 'hotel/awesome.png');
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('The Salt Boutique Hotel by Wyns', 1, 'Boutique Hotel', 5500, 4.6, 'An elegant beachfront boutique hotel in Urbiztondo with a sea-view pool, private beach area, and chic modern rooms.', 'Pool, Beachfront, Sea View, Free WiFi, Breakfast', 'hotel/salt.webp');
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('Ciabel Hotel and Fitness Center', 1, 'Hotel', 3200, 4.1, 'A comfortable San Juan hotel a short walk from the beach, with an outdoor pool, fitness center, and Filipino restaurant.', 'Pool, Fitness Center, Restaurant, Free WiFi, Parking', 'hotel/ciabel.jpg');
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('Patio by Balai Norte', 1, 'Hotel', 3500, 4.3, 'A stylish, family-friendly stay in San Juan with a restaurant, bar, fitness room, and a shuttle to its own private beach.', 'Restaurant, Bar, Private Beach, Free WiFi, Parking', 'hotel/patio.jpg');
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('Villa d'' El-Lita Hotel, Resort & Restaurant', 12, 'Resort', 3800, 4, 'A rustic riverside retreat in Sudipen bordering Ilocos Sur, with comfortable rooms, an infinity pool, conference halls, and panoramic views of the Amburayan River.', 'Free WiFi, Infinity Pool, Restaurant, Bar, Parking', 'hotel/villa.webp');
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('Cococay Resort Hotel', 6, 'Resort', 2200, 3.8, 'A laid-back beach resort in Bauang with direct beach access, a restaurant, and free parking, away from the surf crowd.', 'Beachfront, Restaurant, Free WiFi, Parking', 'hotel/cococay.jpg');
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('Hotel Ariana', 6, 'Hotel', 2400, 4.2, 'A comfortable mid-range hotel in Bauang near business districts and top destinations, ideal for work, leisure, and family stays.', 'Free WiFi, Restaurant, Function Hall, Parking', 'hotel/hotelariana.jpg');
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('J&V Hotel and Resort', 2, 'Resort', 2600, 4, 'A quiet San Fernando resort with an outdoor pool, fitness center, and spacious air-conditioned rooms.', 'Pool, Fitness Center, Spa, Free WiFi, Parking', 'hotel/jv.jpg');
INSERT INTO hotels (name, town_id, type, price, rating, about, amenities, image) VALUES ('Travelite Hotel', 2, 'Inn', 1500, 3.9, 'A budget-friendly inn in the heart of San Fernando City, an easy gateway to La Union''s capital, popular with surfers and backpackers.', 'Free WiFi, Breakfast, Parking', 'hotel/travellite.webp');
