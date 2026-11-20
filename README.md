# Pracovní čas – návod krok za krokem

Aplikace v Reactu s přihlášením a databází Supabase. Data vidí jen přihlášený uživatel (Row Level Security).

## 1. Supabase projekt
1. Na https://supabase.com se zaregistrujte a klikněte **New project**. Zvolte název, silné heslo databáze a region **Frankfurt (eu-central-1)**.
2. Po vytvoření otevřete **SQL Editor → New query**, vložte celý obsah `supabase/schema.sql` a klikněte **Run**. Vzniknou tabulky, zabezpečení a výchozí kategorie.
3. **Project Settings → API**: zkopírujte **Project URL** a klíč **anon public**. Klíč `service_role` nikam nevkládejte a nikomu ho neukazujte.
4. **Authentication → URL Configuration**: do **Site URL** zadejte adresu aplikace (po nasazení, např. `https://moje-domena.cz`), do **Redirect URLs** přidejte totéž. Bez toho nebude fungovat obnovení hesla a potvrzovací e-maily.
5. (Volitelné) **Authentication → Providers → Email**: potvrzování e-mailu můžete vypnout, pokud ho nechcete.

## 2. Spuštění na vašem počítači (test)
1. Nainstalujte Node.js (LTS) z https://nodejs.org.
2. Zkopírujte `.env.example` na `.env` a vyplňte obě hodnoty z kroku 1.3.
3. V terminálu ve složce projektu: `npm install`, pak `npm run dev` a otevřete adresu, kterou program vypíše.

## 3. Nasazení na Vercel (HTTPS zdarma)
1. Nahrajte složku na GitHub (nový repozitář; soubor `.env` se nenahrává, je v `.gitignore`).
2. Na https://vercel.com se přihlaste přes GitHub, **Add New → Project**, vyberte repozitář. Framework Vite se pozná sám.
3. V **Environment Variables** přidejte `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY` (hodnoty z kroku 1.3) a klikněte **Deploy**.
4. Adresu `.vercel.app` zadejte do Supabase (krok 1.4). Vlastní doménu přidáte v **Settings → Domains**, HTTPS certifikát vytvoří Vercel automaticky.
(Netlify funguje stejně: build `npm run build`, složka `dist`, stejné dvě proměnné.)

## Zatím chybí
Export a import CSV/JSON a ruční přepínač světlého/tmavého režimu (aplikace se řídí nastavením systému).
