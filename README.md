# La Union Tour

A database-driven web application that promotes the province of **La Union, Philippines**.
Visitors can browse tourist spots, read about each place, sign up / log in, save
favourites, plan tours, and reserve hotels. After a booking the site suggests
nearby places (hotels near a spot, or spots near a hotel).

This is our final project for **COMP-20163 (Web Development)**.

## Tech stack

- **Front end:** HTML5 (semantic tags), CSS3 (responsive, mobile-friendly), JavaScript (form validation, interactive components, dynamic content via `fetch`)
- **Back end:** PHP 8 (sessions, authentication, CRUD, form handling)
- **Database:** MySQL 8 (relational tables with foreign keys)

## Folder structure

```
launion-tour/
  index.html        landing page (tourist spots + hotel teaser)
  hotels.html       hotels list + reservation
  login.html        login
  signup.html       sign up (with live password rules + confirm)
  profile.html      edit profile
  trips.html        my trips (bookings + saved)
  css/style.css     all styles
  js/               app.js (shared), index.js, hotels.js, trips.js
  img/beach/        beach photos
  api/              PHP endpoints (see below)
  sql/setup.sql     database + tables + seed data
```

## How to set up and run

You need **PHP 8+** and **MySQL 8+** installed.

### 1. Create the database

Open **MySQL Workbench** (or the MySQL command line) and run the script
[`sql/setup.sql`](sql/setup.sql). It will:

- create the database `launion_tour`,
- create a dedicated user `launion_user` (password `LaUnion2026!`),
- create all the tables, and
- insert the towns, tourist spots, and hotels.

Command line option:

```
mysql -u root -p < sql/setup.sql
```

> The database credentials are in [`api/db.php`](api/db.php). If your MySQL setup
> is different, edit the values there.

### 2. Start the web server

From the project folder:

```
php -S localhost:8000
```

Then open **http://localhost:8000** in your browser.

(You can also copy the folder into `xampp/htdocs/` and open it through Apache.)

### 3. Try it

Sign up for an account, browse the spots, save a few with the heart button,
plan a tour or reserve a hotel, then open **My Trips** to see and manage them.

## API endpoints (PHP)

| File | Method | Purpose |
|------|--------|---------|
| `api/signup.php` | POST | create an account |
| `api/login.php` | POST | log in |
| `api/logout.php` | POST | log out |
| `api/me.php` | GET | current logged-in user |
| `api/profile.php` | POST | update name / email / password |
| `api/spots.php` | GET | list tourist spots + categories |
| `api/hotels.php` | GET | list hotels |
| `api/suggestions.php` | GET | nearby spots/hotels |
| `api/saved.php` | GET/POST/DELETE | saved items (read / add / remove) |
| `api/book-tour.php` | POST | plan a tour |
| `api/book-hotel.php` | POST | reserve a hotel |
| `api/bookings.php` | GET | list the user's bookings |
| `api/cancel-booking.php` | POST | cancel a booking |
| `api/delete-booking.php` | POST | remove a booking |

## Notes

- Tourist spot information is real. **Hotel rates and details are sample placeholders.**
- The home page hero plays `video/launion-hero.mp4` if you add one; otherwise it shows a colored background.
- Full project documentation (objectives, diagrams, data dictionary, testing) is in [`DOCUMENTATION.md`](DOCUMENTATION.md).

## Data sources

Tourist spot details were compiled by the group from public tourism listings for
La Union. Beach photos were taken/collected by the group.
