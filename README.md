# ELYUNA

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

> **Important — PHP must have the MySQL extension enabled.**
> The app talks to MySQL through PHP's `pdo_mysql` extension. **XAMPP enables it
> by default**, so if you run it through XAMPP you can skip this. If you use a
> standalone PHP (e.g. installed with WinGet), open your `php.ini` and make sure
> these three lines are present and **not** commented out, then restart the server:
>
> ```
> extension_dir = "ext"
> extension=openssl
> extension=mysqli
> extension=pdo_mysql
> ```
>
> Check it with `php -m` — you should see `pdo_mysql` in the list. (If `pdo_mysql`
> is missing, the page will get stuck on the loading screen because it can't reach
> the database.)

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

## Troubleshooting

- **Stuck on the "Loading ELYUNA" screen / spots never appear.** PHP can't reach the
  database. Open `http://localhost:8000/api/spots.php` directly — if it shows
  *"Could not connect to the database"*, then either (a) `pdo_mysql` isn't enabled
  (see the requirement above), or (b) `sql/setup.sql` hasn't been run, or (c) the
  credentials in `api/db.php` don't match your MySQL. Fix the cause and refresh.
- **Run only one server at a time.** Starting a second `php -S` on the same port can
  cause requests to flicker between working and failing.

## Notes

- Tourist spots and hotels are real La Union places. **Hotel nightly rates are sample figures.**
- The home page hero plays `video/launion-hero.webm` if present; otherwise it shows a colored background. The video is a large local asset and is **not** committed to the repo (kept out by `.gitignore`), so add your own clip to the `video/` folder. Keep it small (ideally under ~10 MB) for fast loading.
- Full project documentation (objectives, diagrams, data dictionary, testing) is in [`DOCUMENTATION.md`](DOCUMENTATION.md).
- A presentation/defense study guide (how the layers connect, plus a syntax cheatsheet) is in [`REVIEWER.md`](REVIEWER.md).

## Data sources

Tourist spot details were compiled by the group from public tourism listings for
La Union. Beach photos were taken/collected by the group.
