DROP TYPE IF EXISTS tipuri_produse;
DROP TYPE IF EXISTS categorii_gama;
CREATE TYPE tipuri_produse AS ENUM('makeup', 'skincare', 'accesorii');

CREATE TYPE categorii_gama AS ENUM('luxury', 'profesionale', 'accesibile');

CREATE TABLE IF NOT EXISTS produse (
   id serial PRIMARY KEY,
   nume VARCHAR(100) UNIQUE NOT NULL,
   descriere TEXT,
   imagine VARCHAR(300),
   categorie_mare tipuri_produse DEFAULT 'makeup',
   subcategorie categorii_gama DEFAULT 'accesibile',
   pret NUMERIC(8,2) NOT NULL CHECK (pret > 0),
   cantitate_ml_g INT NOT NULL CHECK (cantitate_ml_g > 0),
   data_adaugare TIMESTAMP DEFAULT current_timestamp,
   zona_aplicare VARCHAR(50) NOT NULL CHECK (zona_aplicare IN ('fata', 'ochi', 'buze', 'ten')), 
   ingrediente_cheie TEXT,
   cruelty_free BOOLEAN NOT NULL DEFAULT TRUE,
   brand VARCHAR(100) NOT NULL 
);

INSERT INTO produse (nume, descriere, imagine, categorie_mare, subcategorie, pret, cantitate_ml_g, data_adaugare, zona_aplicare, ingrediente_cheie, cruelty_free, brand) VALUES 

('Fond de ten Fit Me Matte', 'Fond de ten lichid matifiant care controlează strălucirea pielii și micșorează porii.', 'fit-me.jpg', 'makeup', 'accesibile', 60.00, 30, '2026-01-15 10:00:00', 'fata', 'silicon, argila, vitamina e', true, 'Maybelline'),
('Corector Instant Anti-Age Eraser', 'Corector cu aplicator cu burete fin, ascunde cearcănele și liniile fine instant.', 'eraser.jpg', 'makeup', 'accesibile', 52.00, 7, '2025-11-10 14:30:00', 'fata', 'haloxyl, silicon, glicerina', true, 'Maybelline'),
('Mascara Lash Sensational Sky High', 'Mascara pentru lungime nelimitată și volum complet din orice unghi.', 'sky-high.jpg', 'makeup', 'accesibile', 60.00, 9, '2026-02-20 09:15:00', 'ochi', 'extract de bambus, ceara, fibre', true, 'Maybelline'),

('Ruj Lichid Matte Lip Lingerie XXL', 'Ruj lichid mat catifelat rezistent la transfer, textură ultra-ușoară.', 'lip-lingerie.jpg', 'makeup', 'profesionale', 58.00, 4, '2025-09-05 18:20:00', 'buze', 'vitamina e, ulei de jojoba, ceara', true, 'NYX'),
('Paletă Farduri Ultimate Shadow', 'Paletă profesională cu 16 nuanțe intens pigmentate, mate și metalice.', 'ultimate-shadow.jpg', 'makeup', 'profesionale', 95.00, 13, '2026-03-12 11:40:00', 'ochi', 'talc, mica, silicon', true, 'NYX'),
('Spray Fixare Matte Finish', 'Spray de fixare ușor care oferă un finish mat impecabil machiajului tău.', 'setting-spray.jpg', 'makeup', 'profesionale', 58.00, 60, '2026-04-05 16:10:00', 'fata', 'apa, alcool denat, niacinamide', true, 'NYX'),

('Fond de ten Infaillible 32H Fresh Wear', 'Fond de ten rezistent la transfer cu acoperire mare și textură respirabilă.', 'infaillible.jpg', 'makeup', 'profesionale', 75.00, 30, '2025-12-01 08:00:00', 'fata', 'vitamina c, silicon, talc', false, 'L''Oreal'),
('Ser Hidratant Revitalift Filler', 'Ser antirid concentrat cu 1.5% Acid Hialuronic pur pentru volum instant.', 'revitalift-ser.jpg', 'skincare', 'profesionale', 89.00, 30, '2026-04-18 12:00:00', 'ten', 'acid hialuronic, glicerina, apa', false, 'L''Oreal'),
('Cremă de Zi Revitalift Laser X3', 'Cremă corectoare intensă anti-îmbătrânire cu efect de repliere a pielii.', 'revitalift-crema.jpg', 'skincare', 'profesionale', 95.00, 50, '2026-03-01 10:30:00', 'ten', 'retinol, acid hialuronic, pro-xylane', false, 'L''Oreal'),

('Fond de ten Double Wear', 'Fond de ten persistent, mat, cu acoperire impecabilă 24h. Rezistă la căldură.', 'double-wear.jpg', 'makeup', 'luxury', 380.00, 30, '2025-10-25 15:45:00', 'fata', 'silicon, oxid de zinc, talc', false, 'Estee Lauder'),
('Ser Reparator Advanced Night Repair', 'Serul nr. 1 de lux care reduce vizibil semnele cheie ale îmbătrânirii în timpul nopții.', 'anr-ser.jpg', 'skincare', 'luxury', 380.00, 50, '2026-05-01 22:00:00', 'ten', 'acid hialuronic, antioxidanti, bifida ferment', false, 'Estee Lauder'),
('Cremă Revitalizing Supreme+', 'Cremă globală anti-îmbătrânire pentru fermitate, elasticitate și luminozitate radiantă.', 'supreme.jpg', 'skincare', 'luxury', 380.00, 50, '2025-08-14 09:00:00', 'ten', 'extract de moringa, acid hialuronic, unt de shea', false, 'Estee Lauder'),

('Mascara I Love Extreme Volume', 'Mascara pentru un volum extrem, datorită periei mari din fibre.', 'i-love-extreme.jpg', 'makeup', 'accesibile', 18.00, 12, '2026-02-14 11:11:11', 'ochi', 'ceara, colagen, talc', true, 'Essence'),
('Luciu de buze Extreme Shine', 'Gloss de buze cu efect de mărire și volum, strălucire extremă non-lipicioasă.', 'extreme-shine.jpg', 'makeup', 'accesibile', 18.00, 5, '2026-05-10 13:15:00', 'buze', 'vitamina e, ulei de jojoba, polybutene', true, 'Essence'),

('Corector Liquid Camouflage', 'Corector lichid rezistent la apă cu acoperire optimă și îngrijire completă.', 'catrice-camou.jpg', 'makeup', 'accesibile', 22.00, 5, '2025-07-22 14:00:00', 'fata', 'vitamina e, silicon, aloe vera', true, 'Catrice'),
('Ser Facial Glow Booster', 'Ser cu 10% complex de vitamine pentru un ten luminos și intens hidratat.', 'glow-booster.jpg', 'skincare', 'accesibile', 35.00, 30, '2026-03-29 17:45:00', 'ten', 'vitamina c, vitamina e, niacinamide', true, 'Catrice'),

('Fond de ten Lasting Finish 35H', 'Fond de ten hidratant cu acid hialuronic și rezistență extremă la transfer.', 'lasting-finish.jpg', 'makeup', 'accesibile', 48.00, 30, '2025-11-30 11:00:00', 'fata', 'acid hialuronic, vitamina e, silicon', false, 'Rimmel'),
('Pudră Compactă Stay Matte', 'Pudră matifiantă controlată care reduce aspectul porilor până la 6 ore.', 'stay-matte.jpg', 'makeup', 'accesibile', 35.00, 14, '2026-01-05 12:30:00', 'fata', 'talc, minerale, siliciu', false, 'Rimmel'),

('Fond de ten Facefinity All Day Flawless', 'Produs 3-în-1: primer, corector și fond de ten cu tehnologie flexi-hold.', 'facefinity.jpg', 'makeup', 'profesionale', 60.00, 30, '2025-09-18 15:00:00', 'fata', 'silicon, dioxid de titan, talc', false, 'Max Factor'),

('Set 10 Pensule Premium Rose Gold', 'Set complet de pensule profesionale din peri sintetici super moi.', 'pensule-rose.jpg', 'accesorii', 'profesionale', 140.00, 180, '2026-01-20 10:00:00', 'fata', 'par sintetic, lemn, aluminiu', true, 'BeautyTools'),
('Burete Cosmetic Original Blender', 'Burete eliptic moale pentru aplicarea fără dungi a bazei de machiaj.', 'blender.jpg', 'accesorii', 'accesibile', 25.00, 15, '2026-04-02 11:20:00', 'fata', 'poliuretan, apa', true, 'BeautyTools'),
('Dischete Demachiante din Bambus', 'Set de 10 dischete refolosibile din fibre ecologice de bambus cu săculeț inclus.', 'dischete-bambus.jpg', 'accesorii', 'accesibile', 25.00, 45, '2025-10-12 16:40:00', 'ten', 'bumbac, fibre de bambus', true, 'EcoBeauty');


CREATE TABLE IF NOT EXISTS seturi (
    id serial PRIMARY KEY,
    nume_set VARCHAR(100) UNIQUE NOT NULL,
    descriere_set TEXT
);

-- Creare tabel asociere_set
CREATE TABLE IF NOT EXISTS asociere_set (
    id serial PRIMARY KEY,
    id_set INT REFERENCES seturi(id) ON DELETE CASCADE,
    id_produs INT REFERENCES produse(id) ON DELETE CASCADE
);

-- Populare tabel seturi (5 seturi diferite)
INSERT INTO seturi (nume_set, descriere_set) VALUES
('Set Zilnic Maybelline Flawless', 'Rutina de bază ideală pentru un ten mat și privire intensă în fiecare zi.'),
('Set Glam Complet NYX', 'Tot ce ai nevoie pentru un machiaj profesional rezistent la transfer și evenimente.'),
('Set Rutină Anti-Aging Luxury', 'Îngrijire premium de lux pentru combaterea ridurilor și hidratare profundă.'),
('Set Esențial Accesorii', 'Uneltele de nelipsit pentru aplicarea perfectă și demachierea eco-friendly a produselor.'),
('Set Buze și Ochi Sclipitori', 'Combinația perfectă pentru buze voluminoase și o privire dramatică la preț accesibil.');

-- Populare asociere_set (Fiecare set are minim 2 produse)
-- Set 1 (Maybelline): Fond de ten (id: 1), Corector (id: 2), Mascara (id: 3) -> 3 produse
INSERT INTO asociere_set (id_set, id_produs) VALUES 
(1, 1), (1, 2), (1, 3);

-- Set 2 (NYX): Ruj (id: 4), Paletă (id: 5), Spray (id: 6) -> 3 produse
INSERT INTO asociere_set (id_set, id_produs) VALUES 
(2, 4), (2, 5), (2, 6);

-- Set 3 (Estee Lauder & L\'Oreal): Ser ANR (id: 11), Cremă Supreme (id: 12), Ser Revitalift (id: 8) -> 3 produse
INSERT INTO asociere_set (id_set, id_produs) VALUES 
(3, 11), (3, 12), (3, 8);

-- Set 4 (Accesorii): Pensule (id: 20), Burete (id: 21), Dischete (id: 22) -> 3 produse
INSERT INTO asociere_set (id_set, id_produs) VALUES 
(4, 20), (4, 21), (4, 22);

-- Set 5 (Essence): Mascara (id: 13), Gloss (id: 14) -> 2 produse
INSERT INTO asociere_set (id_set, id_produs) VALUES 
(5, 13), (5, 14);


GRANT ALL PRIVILEGES ON DATABASE proiect_beauty_hub TO beauty_hub_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO beauty_hub_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO beauty_hub_admin;