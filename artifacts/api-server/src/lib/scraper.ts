import { db } from "@workspace/db";
import { incidentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { classifyCategory, classifyRiskLevel, extractTags, generateAiSummary } from "./classifier.js";

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  sourceCountry: string; // hint only — always overridden by detectCountry()
}

const NEWS_SOURCES = [
  // ═══════════════════════════════════════════════════════════
  // GLOBAL & INTERNATIONAL WIRE SERVICES
  // ═══════════════════════════════════════════════════════════
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml",                        name: "BBC World News",                  country: "Global" },
  { url: "https://rss.cnn.com/rss/edition_world.rss",                          name: "CNN World",                       country: "Global" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml",                          name: "Al Jazeera English",              country: "Global" },
  { url: "https://feeds.reuters.com/reuters/worldNews",                        name: "Reuters World",                   country: "Global" },
  { url: "https://www.theguardian.com/world/rss",                              name: "The Guardian World",              country: "Global" },
  { url: "https://rss.dw.com/rss/en-world",                                   name: "Deutsche Welle World",            country: "Global" },
  { url: "https://www.france24.com/en/rss",                                   name: "France 24 English",               country: "Global" },
  { url: "https://feeds.npr.org/1001/rss.xml",                                 name: "NPR News",                        country: "Global" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",             name: "New York Times World",            country: "Global" },
  { url: "https://www.washingtonpost.com/rss/world",                           name: "Washington Post World",           country: "Global" },
  { url: "https://feeds.skynews.com/feeds/rss/world.xml",                      name: "Sky News World",                  country: "Global" },
  { url: "https://www.independent.co.uk/news/world/rss",                       name: "The Independent World",           country: "Global" },
  { url: "https://abcnews.go.com/abcnews/internationalheadlines",              name: "ABC News International",          country: "Global" },
  { url: "https://apnews.com/rss/world-news",                                  name: "AP World News",                   country: "Global" },
  { url: "https://www.voanews.com/api/zrqoptkm_t",                             name: "Voice of America",                country: "Global" },
  { url: "https://www.rferl.org/api/zrqoptkm_t",                               name: "Radio Free Europe",               country: "Global" },
  { url: "https://www.bloomberg.com/feeds/politics",                           name: "Bloomberg Politics",              country: "Global" },
  { url: "https://foreignpolicy.com/feed/",                                    name: "Foreign Policy",                  country: "Global" },
  { url: "https://thehill.com/homenews/feed/",                                 name: "The Hill",                        country: "Global" },
  { url: "https://www.euronews.com/rss?level=theme&name=news",                 name: "Euronews",                        country: "Global" },

  // ═══════════════════════════════════════════════════════════
  // SECURITY, CONFLICT & INTELLIGENCE
  // ═══════════════════════════════════════════════════════════
  { url: "https://www.longwarjournal.org/feed",                                name: "Long War Journal",                country: "Global" },
  { url: "https://www.reliefweb.int/headlines/rss.xml",                        name: "ReliefWeb Humanitarian",          country: "Global" },
  { url: "https://www.crisisgroup.org/rss.xml",                                name: "ICG Crisis Group",                country: "Global" },
  { url: "https://insightcrime.org/feed/",                                     name: "InSight Crime",                   country: "Global" },
  { url: "https://acleddata.com/feed/",                                        name: "ACLED Conflict Data",             country: "Global" },
  { url: "https://www.bellingcat.com/feed/",                                   name: "Bellingcat Investigations",       country: "Global" },
  { url: "https://www.stratfor.com/rss.xml",                                   name: "Stratfor Geopolitics",            country: "Global" },
  { url: "https://thesoufancenter.org/feed/",                                  name: "Soufan Center",                   country: "Global" },
  { url: "https://ctc.westpoint.edu/feed/",                                    name: "CTC Sentinel West Point",         country: "Global" },
  { url: "https://www.sipri.org/rss.xml",                                      name: "SIPRI Arms & Conflict",           country: "Global" },
  { url: "https://www.rand.org/topics/national-security/rss.xml",              name: "RAND National Security",          country: "Global" },
  { url: "https://jamestown.org/feed/",                                        name: "Jamestown Foundation",            country: "Global" },

  // ═══════════════════════════════════════════════════════════
  // BBC REGIONAL FEEDS
  // ═══════════════════════════════════════════════════════════
  { url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml",                 name: "BBC Africa",                      country: "Africa" },
  { url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml",                   name: "BBC Asia",                        country: "Asia" },
  { url: "https://feeds.bbci.co.uk/news/world/south_asia/rss.xml",             name: "BBC South Asia",                  country: "South Asia" },
  { url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",            name: "BBC Middle East",                 country: "Middle East" },
  { url: "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml",          name: "BBC Latin America",               country: "Latin America" },
  { url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml",                 name: "BBC Europe",                      country: "Europe" },
  { url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml",          name: "BBC US & Canada",                 country: "United States" },

  // ═══════════════════════════════════════════════════════════
  // SOUTH ASIA
  // ═══════════════════════════════════════════════════════════

  // Pakistan
  { url: "https://www.dawn.com/feeds/home",                                    name: "Dawn Pakistan",                   country: "Pakistan" },
  { url: "https://www.geo.tv/rss/10",                                          name: "Geo News Pakistan",               country: "Pakistan" },
  { url: "https://arynews.tv/feed/",                                           name: "ARY News Pakistan",               country: "Pakistan" },
  { url: "https://www.thenews.com.pk/rss/1/16",                                name: "The News International Pakistan", country: "Pakistan" },
  { url: "https://tribune.com.pk/feed/rss",                                    name: "Express Tribune Pakistan",        country: "Pakistan" },
  { url: "https://nation.com.pk/rss",                                          name: "The Nation Pakistan",             country: "Pakistan" },
  { url: "https://samaa.tv/feed/",                                             name: "Samaa News Pakistan",             country: "Pakistan" },
  { url: "https://www.brecorder.com/feed",                                     name: "Business Recorder Pakistan",      country: "Pakistan" },
  { url: "https://dailytimes.com.pk/feed/",                                    name: "Daily Times Pakistan",            country: "Pakistan" },

  // India
  { url: "https://feeds.feedburner.com/ndtvnews-top-stories",                  name: "NDTV India",                      country: "India" },
  { url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",         name: "Times of India",                  country: "India" },
  { url: "https://indianexpress.com/feed/",                                    name: "The Indian Express",              country: "India" },
  { url: "https://www.thehindu.com/news/national/?service=rss",                name: "The Hindu India",                 country: "India" },
  { url: "https://www.hindustantimes.com/rss/topnews/rssfeed.xml",             name: "Hindustan Times",                 country: "India" },
  { url: "https://zeenews.india.com/rss/india-national-news.xml",              name: "Zee News India",                  country: "India" },
  { url: "https://www.livemint.com/rss/news",                                  name: "Mint India",                      country: "India" },
  { url: "https://scroll.in/rss",                                              name: "Scroll India",                    country: "India" },

  // Bangladesh
  { url: "https://www.thedailystar.net/rss.xml",                               name: "Daily Star Bangladesh",           country: "Bangladesh" },
  { url: "https://bdnews24.com/rss/banglanews/rss.xml",                        name: "bdnews24 Bangladesh",             country: "Bangladesh" },
  { url: "https://www.prothomalo.com/feed",                                    name: "Prothom Alo Bangladesh",          country: "Bangladesh" },

  // Sri Lanka
  { url: "https://www.dailymirror.lk/feed/",                                   name: "Daily Mirror Sri Lanka",          country: "Sri Lanka" },
  { url: "https://www.ft.lk/rss",                                              name: "Financial Times Sri Lanka",       country: "Sri Lanka" },
  { url: "https://adaderana.lk/rss.php",                                       name: "Ada Derana Sri Lanka",            country: "Sri Lanka" },

  // Nepal
  { url: "https://thehimalayantimes.com/feed/",                                name: "Himalayan Times Nepal",           country: "Nepal" },
  { url: "https://myrepublica.nagariknetwork.com/feed",                        name: "My Republica Nepal",              country: "Nepal" },
  { url: "https://kathmandupost.com/rss",                                      name: "Kathmandu Post Nepal",            country: "Nepal" },

  // Afghanistan
  { url: "https://tolonews.com/rss.xml",                                       name: "Tolo News Afghanistan",           country: "Afghanistan" },
  { url: "https://www.khaama.com/feed/",                                       name: "Khaama Press Afghanistan",        country: "Afghanistan" },
  { url: "https://pajhwok.com/en/feed/",                                       name: "Pajhwok Afghan News",             country: "Afghanistan" },

  // ═══════════════════════════════════════════════════════════
  // MIDDLE EAST
  // ═══════════════════════════════════════════════════════════

  // Regional
  { url: "https://www.middleeasteye.net/rss",                                  name: "Middle East Eye",                 country: "Middle East" },
  { url: "https://www.mei.edu/rss.xml",                                        name: "Middle East Institute",           country: "Middle East" },
  { url: "https://english.alarabiya.net/rss.xml",                              name: "Al Arabiya English",              country: "Middle East" },

  // Saudi Arabia
  { url: "https://www.arabnews.com/rss.xml",                                   name: "Arab News Saudi Arabia",          country: "Saudi Arabia" },
  { url: "https://saudigazette.com.sa/rss",                                    name: "Saudi Gazette",                   country: "Saudi Arabia" },

  // UAE
  { url: "https://www.thenationalnews.com/rss",                                name: "The National UAE",                country: "United Arab Emirates" },
  { url: "https://gulfnews.com/rss",                                           name: "Gulf News UAE",                   country: "United Arab Emirates" },
  { url: "https://www.khaleejtimes.com/rss",                                   name: "Khaleej Times UAE",               country: "United Arab Emirates" },

  // Israel & Palestine
  { url: "https://www.timesofisrael.com/feed/",                                name: "Times of Israel",                 country: "Israel" },
  { url: "https://www.haaretz.com/srv/haaretz-eng-rss",                        name: "Haaretz Israel",                  country: "Israel" },
  { url: "https://www.jpost.com/rss/rssfeedsworld.aspx",                       name: "Jerusalem Post",                  country: "Israel" },
  { url: "https://www.maannews.com/rss",                                       name: "Ma'an News Agency Palestine",     country: "Palestine" },
  { url: "https://www.wafa.ps/rss",                                            name: "WAFA Palestine",                  country: "Palestine" },

  // Iran
  { url: "https://www.presstv.ir/rss.xml",                                     name: "Press TV Iran",                   country: "Iran" },
  { url: "https://iranwire.com/en/feed/",                                      name: "IranWire",                        country: "Iran" },
  { url: "https://www.tehrantimes.com/rss",                                    name: "Tehran Times",                    country: "Iran" },

  // Iraq
  { url: "https://www.rudaw.net/rss",                                          name: "Rudaw Iraq",                      country: "Iraq" },
  { url: "https://www.iraqinews.com/feed/",                                    name: "Iraq News",                       country: "Iraq" },
  { url: "https://shafaq.com/en/rss.xml",                                      name: "Shafaq News Iraq",                country: "Iraq" },

  // Syria
  { url: "https://www.syriahr.com/en/feed/",                                   name: "Syrian Observatory",              country: "Syria" },
  { url: "https://www.syriadirect.org/feed/",                                  name: "Syria Direct",                    country: "Syria" },

  // Lebanon
  { url: "https://www.naharnet.com/stories/en/rss",                            name: "Naharnet Lebanon",                country: "Lebanon" },
  { url: "https://www.dailystar.com.lb/Tools/RSS.aspx",                        name: "Daily Star Lebanon",              country: "Lebanon" },
  { url: "https://www.lorientlejour.com/rss",                                  name: "L'Orient Lebanon",                country: "Lebanon" },

  // Yemen
  { url: "https://www.yemenfuture.net/en/feed",                                name: "Yemen Future",                    country: "Yemen" },
  { url: "https://sanaanews.net/feed/",                                        name: "Sana'a News Yemen",               country: "Yemen" },

  // Jordan
  { url: "https://www.jordantimes.com/rss.xml",                                name: "Jordan Times",                    country: "Jordan" },
  { url: "https://www.petra.gov.jo/Public/Rss",                                name: "Petra Jordan News Agency",        country: "Jordan" },

  // Kuwait
  { url: "https://www.arabtimesonline.com/feed/",                              name: "Arab Times Kuwait",               country: "Kuwait" },
  { url: "https://news.kuwaittimes.net/feed/",                                 name: "Kuwait Times",                    country: "Kuwait" },

  // Qatar
  { url: "https://thepeninsulaqatar.com/rss",                                  name: "The Peninsula Qatar",             country: "Qatar" },

  // Bahrain
  { url: "https://www.gdnonline.com/rss",                                      name: "Gulf Daily News Bahrain",         country: "Bahrain" },

  // Oman
  { url: "https://timesofoman.com/rss",                                        name: "Times of Oman",                   country: "Oman" },

  // Turkey
  { url: "https://www.dailysabah.com/rss",                                     name: "Daily Sabah Turkey",              country: "Turkey" },
  { url: "https://www.hurriyetdailynews.com/rss",                              name: "Hurriyet Daily News Turkey",      country: "Turkey" },
  { url: "https://www.trtworld.com/rss",                                       name: "TRT World Turkey",                country: "Turkey" },
  { url: "https://bianet.org/english/rss",                                     name: "Bianet Turkey",                   country: "Turkey" },

  // ═══════════════════════════════════════════════════════════
  // AFRICA
  // ═══════════════════════════════════════════════════════════

  // Pan-African
  { url: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf",     name: "AllAfrica Headlines",             country: "Africa" },
  { url: "https://allafrica.com/tools/headlines/rdf/security/headlines.rdf",   name: "AllAfrica Security",              country: "Africa" },
  { url: "https://www.africaintelligence.com/rss",                             name: "Africa Intelligence",             country: "Africa" },
  { url: "https://africanews.com/feed",                                        name: "Africanews",                      country: "Africa" },
  { url: "https://www.theafricareport.com/feed/",                              name: "The Africa Report",               country: "Africa" },

  // Nigeria
  { url: "https://www.vanguardngr.com/feed/",                                  name: "Vanguard Nigeria",                country: "Nigeria" },
  { url: "https://punchng.com/feed/",                                          name: "Punch Nigeria",                   country: "Nigeria" },
  { url: "https://www.premiumtimesng.com/feed/",                               name: "Premium Times Nigeria",           country: "Nigeria" },
  { url: "https://www.channelstv.com/feed/",                                   name: "Channels TV Nigeria",             country: "Nigeria" },
  { url: "https://www.thisdaylive.com/index.php/feed/",                        name: "This Day Nigeria",                country: "Nigeria" },
  { url: "https://businessday.ng/feed/",                                       name: "BusinessDay Nigeria",             country: "Nigeria" },
  { url: "https://guardian.ng/feed/",                                          name: "The Guardian Nigeria",            country: "Nigeria" },

  // Kenya
  { url: "https://www.nation.africa/kenya/rss.xml",                            name: "Daily Nation Kenya",              country: "Kenya" },
  { url: "https://www.standardmedia.co.ke/rss",                                name: "Standard Media Kenya",            country: "Kenya" },
  { url: "https://www.the-star.co.ke/rss",                                     name: "The Star Kenya",                  country: "Kenya" },
  { url: "https://www.capitalfm.co.ke/news/feed/",                             name: "Capital FM Kenya",                country: "Kenya" },
  { url: "https://www.kbc.co.ke/feed/",                                        name: "KBC Kenya",                       country: "Kenya" },

  // South Africa
  { url: "https://www.dailymaverick.co.za/rss",                                name: "Daily Maverick South Africa",     country: "South Africa" },
  { url: "https://www.news24.com/news24/feed",                                 name: "News24 South Africa",             country: "South Africa" },
  { url: "https://ewn.co.za/RSS/TopStories",                                   name: "EWN South Africa",                country: "South Africa" },
  { url: "https://www.iol.co.za/rss",                                          name: "IOL South Africa",                country: "South Africa" },
  { url: "https://www.timeslive.co.za/rss/",                                   name: "TimesLive South Africa",          country: "South Africa" },
  { url: "https://www.sowetanlive.co.za/rss",                                  name: "Sowetan South Africa",            country: "South Africa" },

  // Egypt
  { url: "https://www.egyptindependent.com/feed/",                             name: "Egypt Independent",               country: "Egypt" },
  { url: "https://english.ahram.org.eg/rss.aspx",                              name: "Al-Ahram Egypt",                  country: "Egypt" },
  { url: "https://www.madamasr.com/en/feed/",                                  name: "Mada Masr Egypt",                 country: "Egypt" },

  // Ghana
  { url: "https://www.ghanaweb.com/GhanaHomePage/rss/ghanaweb.xml",           name: "Ghana Web",                       country: "Ghana" },
  { url: "https://www.myjoyonline.com/feed/",                                  name: "Joy Online Ghana",                country: "Ghana" },
  { url: "https://www.graphic.com.gh/feed.xml",                                name: "Graphic Online Ghana",            country: "Ghana" },

  // Ethiopia
  { url: "https://www.ethiopiaobserver.com/feed/",                             name: "Ethiopia Observer",               country: "Ethiopia" },
  { url: "https://addisstandard.com/feed/",                                    name: "Addis Standard Ethiopia",         country: "Ethiopia" },
  { url: "https://www.ethiotelecom.et/rss",                                    name: "Addis Fortune Ethiopia",          country: "Ethiopia" },

  // Uganda
  { url: "https://www.monitor.co.ug/Uganda/rss",                              name: "Daily Monitor Uganda",            country: "Uganda" },
  { url: "https://www.newvision.co.ug/rss",                                   name: "New Vision Uganda",               country: "Uganda" },
  { url: "https://observer.ug/index.php?format=feed",                          name: "The Observer Uganda",             country: "Uganda" },

  // Tanzania
  { url: "https://www.thecitizen.co.tz/rss",                                   name: "The Citizen Tanzania",            country: "Tanzania" },
  { url: "https://www.ippmedia.com/en/rss",                                    name: "IPP Media Tanzania",              country: "Tanzania" },

  // Sudan & South Sudan
  { url: "https://www.sudantribune.com/spip.php?page=backend",                 name: "Sudan Tribune",                   country: "Sudan" },
  { url: "https://radiotamazuj.org/en/rss.xml",                                name: "Radio Tamazuj South Sudan",       country: "South Sudan" },
  { url: "https://www.eyeradio.org/feed/",                                     name: "Eye Radio South Sudan",           country: "South Sudan" },

  // Somalia
  { url: "https://www.garoweonline.com/en/rss",                                name: "Garowe Online Somalia",           country: "Somalia" },
  { url: "https://horseedmedia.net/feed/",                                     name: "Horseed Media Somalia",           country: "Somalia" },
  { url: "https://www.somaliguardian.com/feed/",                               name: "Somali Guardian",                 country: "Somalia" },

  // Mali & Sahel
  { url: "https://www.maliweb.net/rss",                                        name: "Maliweb Mali",                    country: "Mali" },
  { url: "https://lefaso.net/spip.php?page=backend",                           name: "LeFaso Burkina Faso",             country: "Burkina Faso" },
  { url: "https://www.nigerdiaspora.net/feed/",                                name: "Niger Diaspora",                  country: "Niger" },

  // Libya
  { url: "https://www.libyanobserver.ly/feed/",                                name: "Libyan Observer",                 country: "Libya" },
  { url: "https://libyaherald.com/feed/",                                      name: "Libya Herald",                    country: "Libya" },

  // Morocco / Tunisia / Algeria
  { url: "https://www.moroccoworldnews.com/feed/",                             name: "Morocco World News",              country: "Morocco" },
  { url: "https://www.hespress.com/feed/",                                     name: "Hespress Morocco",                country: "Morocco" },
  { url: "https://www.tap.info.tn/en/en/rss",                                  name: "TAP Agency Tunisia",              country: "Tunisia" },
  { url: "https://www.algerie360.com/feed/",                                   name: "Algerie360",                      country: "Algeria" },

  // Rwanda / DRC / Central Africa
  { url: "https://www.newtimes.co.rw/rss",                                     name: "New Times Rwanda",                country: "Rwanda" },
  { url: "https://www.radiookapi.net/feed",                                    name: "Radio Okapi DR Congo",            country: "DR Congo" },
  { url: "https://actualite.cd/feed",                                          name: "Actualite.cd DR Congo",           country: "DR Congo" },

  // Zimbabwe / Zambia
  { url: "https://www.newsday.co.zw/feed/",                                    name: "Newsday Zimbabwe",                country: "Zimbabwe" },
  { url: "https://www.herald.co.zw/feed/",                                     name: "The Herald Zimbabwe",             country: "Zimbabwe" },
  { url: "https://www.lusakatimes.com/feed/",                                  name: "Lusaka Times Zambia",             country: "Zambia" },

  // Mozambique / Angola
  { url: "https://clubofmozambique.com/feed/",                                 name: "Club of Mozambique",              country: "Mozambique" },
  { url: "https://www.angop.ao/angola/en_us/rss",                              name: "ANGOP Angola",                    country: "Angola" },

  // Cameroon / Ivory Coast / Senegal
  { url: "https://www.journalducameroun.com/feed/",                            name: "Journal du Cameroun",             country: "Cameroon" },
  { url: "https://www.connectionivoirienne.net/feed",                          name: "Connection Ivoirienne",           country: "Ivory Coast" },
  { url: "https://www.seneweb.com/rss/news.xml",                               name: "Seneweb Senegal",                 country: "Senegal" },

  // ═══════════════════════════════════════════════════════════
  // EUROPE
  // ═══════════════════════════════════════════════════════════

  // Ukraine & Russia
  { url: "https://www.kyivpost.com/rss",                                       name: "Kyiv Post Ukraine",               country: "Ukraine" },
  { url: "https://kyivindependent.com/feed/",                                  name: "Kyiv Independent Ukraine",        country: "Ukraine" },
  { url: "https://en.interfax.com.ua/news/general.rss",                        name: "Interfax Ukraine",                country: "Ukraine" },
  { url: "https://www.ukrinform.net/rss/block-lastnews",                       name: "Ukrinform Ukraine",               country: "Ukraine" },
  { url: "https://meduza.io/rss/en/all",                                       name: "Meduza Russia",                   country: "Russia" },
  { url: "https://www.themoscowtimes.com/rss/news",                            name: "The Moscow Times",                country: "Russia" },
  { url: "https://novayagazeta.eu/rss",                                        name: "Novaya Gazeta Europe Russia",     country: "Russia" },

  // United Kingdom
  { url: "https://www.bbc.co.uk/news/england/rss.xml",                         name: "BBC England",                     country: "United Kingdom" },
  { url: "https://www.theguardian.com/uk-news/rss",                            name: "The Guardian UK",                 country: "United Kingdom" },
  { url: "https://www.telegraph.co.uk/news/rss.xml",                           name: "The Telegraph UK",                country: "United Kingdom" },
  { url: "https://www.independent.co.uk/news/uk/rss",                          name: "The Independent UK",              country: "United Kingdom" },

  // Germany / France / Spain / Italy
  { url: "https://www.spiegel.de/international/index.rss",                     name: "Der Spiegel Germany",             country: "Germany" },
  { url: "https://www.lemonde.fr/rss/en_continu.xml",                          name: "Le Monde France",                 country: "France" },
  { url: "https://english.elpais.com/rss/",                                    name: "El Pais Spain",                   country: "Spain" },
  { url: "https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml",               name: "ANSA Italy",                      country: "Italy" },
  { url: "https://www.thelocal.fr/feeds/rss",                                  name: "The Local France",                country: "France" },
  { url: "https://www.thelocal.de/feeds/rss",                                  name: "The Local Germany",               country: "Germany" },
  { url: "https://www.thelocal.es/feeds/rss",                                  name: "The Local Spain",                 country: "Spain" },
  { url: "https://www.thelocal.it/feeds/rss",                                  name: "The Local Italy",                 country: "Italy" },

  // Poland / Hungary / Balkans
  { url: "https://www.polskieradio.pl/395/7989/rss.xml",                       name: "Polish Radio External",           country: "Poland" },
  { url: "https://dailynewshungary.com/feed/",                                 name: "Daily News Hungary",              country: "Hungary" },
  { url: "https://balkaninsight.com/feed/",                                    name: "Balkan Insight",                  country: "Serbia" },
  { url: "https://www.b92.net/rss/info.xml",                                   name: "B92 Serbia",                      country: "Serbia" },

  // Caucasus & Central/Eastern Europe
  { url: "https://civil.ge/feed",                                              name: "Civil Georgia",                   country: "Georgia" },
  { url: "https://jam-news.net/feed/",                                         name: "JAM News Azerbaijan",             country: "Azerbaijan" },
  { url: "https://www.azatutyun.am/api/zrqoptkm_t",                            name: "Azatutyun Armenia",               country: "Armenia" },
  { url: "https://moldova.org/en/feed",                                        name: "Moldova.org",                     country: "Moldova" },

  // Belarus
  { url: "https://spring96.org/en/rss",                                        name: "Spring 96 Belarus HR",            country: "Belarus" },

  // Greece / Cyprus
  { url: "https://www.ekathimerini.com/rss/latest",                            name: "Ekathimerini Greece",             country: "Greece" },
  { url: "https://cyprus-mail.com/feed/",                                      name: "Cyprus Mail",                     country: "Cyprus" },

  // ═══════════════════════════════════════════════════════════
  // AMERICAS
  // ═══════════════════════════════════════════════════════════

  // United States
  { url: "https://www.cbsnews.com/latest/rss/world",                           name: "CBS News World",                  country: "United States" },
  { url: "https://feeds.foxnews.com/foxnews/world",                            name: "Fox News World",                  country: "United States" },
  { url: "https://www.politico.com/rss/politics08.xml",                        name: "Politico US",                     country: "United States" },
  { url: "https://theintercept.com/feed/?rss",                                 name: "The Intercept",                   country: "United States" },
  { url: "https://www.axios.com/rss/world.rss",                                name: "Axios World",                     country: "United States" },
  { url: "https://www.pbs.org/newshour/feeds/rss/world",                       name: "PBS NewsHour World",              country: "United States" },

  // Mexico
  { url: "https://www.eluniversal.com.mx/rss.xml",                             name: "El Universal Mexico",             country: "Mexico" },
  { url: "https://www.milenio.com/rss",                                        name: "Milenio Mexico",                  country: "Mexico" },
  { url: "https://www.proceso.com.mx/feed/",                                   name: "Proceso Mexico",                  country: "Mexico" },
  { url: "https://www.animalpolitico.com/feed/",                               name: "Animal Politico Mexico",          country: "Mexico" },

  // Brazil
  { url: "https://www.agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",  name: "Agencia Brasil",                  country: "Brazil" },
  { url: "https://noticias.uol.com.br/ultnot/index.xml",                       name: "UOL Noticias Brazil",             country: "Brazil" },

  // Colombia / Venezuela / Ecuador / Peru / Chile / Argentina
  { url: "https://www.elespectador.com/rss",                                   name: "El Espectador Colombia",          country: "Colombia" },
  { url: "https://www.semana.com/rss/",                                        name: "Semana Colombia",                 country: "Colombia" },
  { url: "https://www.venezuelaanalysis.com/rss.xml",                          name: "Venezuela Analysis",              country: "Venezuela" },
  { url: "https://efectococuyo.com/feed/",                                     name: "Efecto Cocuyo Venezuela",         country: "Venezuela" },
  { url: "https://www.elcomercio.com/rss",                                     name: "El Comercio Ecuador",             country: "Ecuador" },
  { url: "https://larepublica.pe/feed/",                                       name: "La Republica Peru",               country: "Peru" },
  { url: "https://www.latercera.com/feed/",                                    name: "La Tercera Chile",                country: "Chile" },
  { url: "https://www.infobae.com/feeds/rss/",                                 name: "Infobae Argentina",               country: "Argentina" },
  { url: "https://www.clarin.com/rss/mundo/",                                  name: "Clarin Argentina",                country: "Argentina" },

  // Central America
  { url: "https://elfaro.net/rss/",                                            name: "El Faro El Salvador",             country: "El Salvador" },
  { url: "https://www.prensalibre.com/feed/",                                  name: "Prensa Libre Guatemala",          country: "Guatemala" },
  { url: "https://www.laprensa.hn/feed/",                                      name: "La Prensa Honduras",              country: "Honduras" },

  // Caribbean
  { url: "https://www.haitilibre.com/en/rss",                                  name: "Haiti Libre",                     country: "Haiti" },
  { url: "https://www.loopnewsjamaica.com/rss/headlines",                      name: "Loop News Jamaica",               country: "Jamaica" },

  // ═══════════════════════════════════════════════════════════
  // EAST ASIA & PACIFIC
  // ═══════════════════════════════════════════════════════════

  // China
  { url: "https://www.scmp.com/rss/91/feed",                                   name: "South China Morning Post",        country: "China" },
  { url: "https://www.globaltimes.cn/rss/outbrain.xml",                        name: "Global Times China",              country: "China" },
  { url: "https://rss.cnn.com/rss/edition_asia.rss",                          name: "CNN Asia",                        country: "Asia" },

  // Japan
  { url: "https://www3.nhk.or.jp/nhkworld/en/news/feeds/",                    name: "NHK World Japan",                 country: "Japan" },
  { url: "https://japantoday.com/feed",                                        name: "Japan Today",                     country: "Japan" },
  { url: "https://www.asahi.com/ajw/rss.rdf",                                  name: "Asahi Shimbun Japan",             country: "Japan" },
  { url: "https://www.japantimes.co.jp/feed/",                                 name: "Japan Times",                     country: "Japan" },

  // South Korea
  { url: "https://www.koreaherald.com/common/rss_xml.php",                     name: "Korea Herald",                    country: "South Korea" },
  { url: "https://english.hani.co.kr/rss",                                    name: "Hankyoreh Korea",                 country: "South Korea" },
  { url: "https://koreajoongangdaily.joins.com/rss/rssNational.xml",           name: "JoongAng Daily Korea",            country: "South Korea" },

  // Taiwan
  { url: "https://focustaiwan.tw/rss/ai.xml",                                  name: "Focus Taiwan",                    country: "Taiwan" },
  { url: "https://www.taipeitimes.com/xml/index.rss",                          name: "Taipei Times",                    country: "Taiwan" },

  // North Korea
  { url: "https://www.nknews.org/feed/",                                       name: "NK News North Korea",             country: "North Korea" },
  { url: "https://www.38north.org/feed/",                                      name: "38 North DPRK",                   country: "North Korea" },

  // Southeast Asia
  { url: "https://www.channelnewsasia.com/rssfeeds/8395884",                   name: "Channel News Asia",               country: "Asia" },
  { url: "https://www.rfa.org/english/RSS",                                    name: "Radio Free Asia",                 country: "Asia" },
  { url: "https://www.bangkokpost.com/rss/data/topstories.xml",                name: "Bangkok Post Thailand",           country: "Thailand" },
  { url: "https://www.nationthailand.com/feed",                                name: "Nation Thailand",                 country: "Thailand" },
  { url: "https://www.philstar.com/rss/headlines",                             name: "Philstar Philippines",            country: "Philippines" },
  { url: "https://www.rappler.com/feed",                                       name: "Rappler Philippines",             country: "Philippines" },
  { url: "https://www.abs-cbn.com/rss/latest-news",                            name: "ABS-CBN Philippines",             country: "Philippines" },
  { url: "https://www.manilatimes.net/feed/",                                  name: "Manila Times Philippines",        country: "Philippines" },
  { url: "https://www.straitstimes.com/rss",                                   name: "Straits Times Singapore",         country: "Singapore" },
  { url: "https://mothership.sg/feed/",                                        name: "Mothership Singapore",            country: "Singapore" },
  { url: "https://www.malaymail.com/feed",                                     name: "Malay Mail Malaysia",             country: "Malaysia" },
  { url: "https://www.freemalaysiatoday.com/feed/",                            name: "Free Malaysia Today",             country: "Malaysia" },
  { url: "https://www.thejakartapost.com/feed",                                name: "Jakarta Post Indonesia",          country: "Indonesia" },
  { url: "https://www.antaranews.com/rss/en/top-stories",                      name: "Antara News Indonesia",           country: "Indonesia" },
  { url: "https://en.vietnamplus.vn/rss/home.rss",                             name: "Vietnam Plus",                    country: "Vietnam" },
  { url: "https://www.vnexpress.net/rss/world.rss",                            name: "VN Express Vietnam",              country: "Vietnam" },
  { url: "https://www.phnompenhpost.com/rss.xml",                              name: "Phnom Penh Post Cambodia",        country: "Cambodia" },
  { url: "https://myanmar-now.org/en/feed",                                    name: "Myanmar Now",                     country: "Myanmar" },
  { url: "https://www.irrawaddy.com/feed",                                     name: "The Irrawaddy Myanmar",           country: "Myanmar" },
  { url: "https://www.rfa.org/english/news/laos/feed",                         name: "RFA Laos",                        country: "Laos" },

  // Australia / New Zealand / Pacific
  { url: "https://www.abc.net.au/news/feed/51120/rss.xml",                     name: "ABC News Australia",              country: "Australia" },
  { url: "https://www.smh.com.au/rss/world.xml",                               name: "Sydney Morning Herald",           country: "Australia" },
  { url: "https://www.theguardian.com/australia-news/rss",                     name: "Guardian Australia",              country: "Australia" },
  { url: "https://www.rnz.co.nz/rss/world.xml",                                name: "RNZ New Zealand",                 country: "New Zealand" },
  { url: "https://www.rnz.co.nz/rss/pacific.xml",                              name: "RNZ Pacific",                     country: "Australia" },

  // ═══════════════════════════════════════════════════════════
  // CENTRAL ASIA
  // ═══════════════════════════════════════════════════════════
  { url: "https://www.rferl.org/api/zvqeoykmruy",                              name: "RFE/RL Kazakhstan",               country: "Kazakhstan" },
  { url: "https://www.rferl.org/api/ztoytlurvm",                               name: "RFE/RL Uzbekistan",               country: "Uzbekistan" },
  { url: "https://www.rferl.org/api/ztrizkuopvy",                              name: "RFE/RL Tajikistan",               country: "Tajikistan" },
  { url: "https://www.rferl.org/api/zruykyvzpq",                               name: "RFE/RL Kyrgyzstan",               country: "Kyrgyzstan" },
  { url: "https://turkmenistannews.com/feed/",                                 name: "Turkmenistan News",               country: "Turkmenistan" },

  // ═══════════════════════════════════════════════════════════
  // SCANDINAVIA & NORTHERN EUROPE
  // ═══════════════════════════════════════════════════════════
  { url: "https://www.thelocal.se/feeds/rss",                                  name: "The Local Sweden",                country: "Sweden" },
  { url: "https://www.thelocal.no/feeds/rss",                                  name: "The Local Norway",                country: "Norway" },
  { url: "https://www.thelocal.dk/feeds/rss",                                  name: "The Local Denmark",               country: "Denmark" },
  { url: "https://yle.fi/uutiset/rss/uutiset.rss",                             name: "YLE News Finland",                country: "Finland" },
  { url: "https://www.err.ee/rss",                                             name: "ERR Estonia",                     country: "Estonia" },
  { url: "https://eng.lsm.lv/rss.xml",                                         name: "LSM Latvia",                      country: "Latvia" },
  { url: "https://www.lrt.lt/en/rss",                                          name: "LRT Lithuania",                   country: "Lithuania" },

  // ═══════════════════════════════════════════════════════════
  // TOPIC-SPECIFIC INTELLIGENCE FEEDS
  // ═══════════════════════════════════════════════════════════
  { url: "https://www.terrorism-analysts.com/feed/",                           name: "Terrorism Analysts",              country: "Global" },
  { url: "https://www.securitycouncilreport.org/news.php?rss=1",               name: "UN Security Council Report",      country: "Global" },
  { url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml",             name: "UN News Global",                  country: "Global" },
  { url: "https://www.ohchr.org/en/rss-feeds",                                 name: "OHCHR Human Rights",              country: "Global" },
  { url: "https://www.interpol.int/rss/news.rss",                              name: "INTERPOL News",                   country: "Global" },
  { url: "https://www.unodc.org/rss/en/news.rss",                              name: "UNODC Drugs & Crime",             country: "Global" },
  { url: "https://www.iaea.org/feeds/topnews.xml",                             name: "IAEA Nuclear",                    country: "Global" },
  { url: "https://www.opcw.org/rss-feed",                                      name: "OPCW Chemical Weapons",           country: "Global" },
  { url: "https://www.ifrc.org/rss",                                           name: "Red Cross IFRC",                  country: "Global" },
  { url: "https://www.amnesty.org/en/feed/",                                   name: "Amnesty International",           country: "Global" },
  { url: "https://www.hrw.org/rss.xml",                                        name: "Human Rights Watch",              country: "Global" },
  { url: "https://rsf.org/en/rss.xml",                                         name: "Reporters Without Borders",       country: "Global" },
  { url: "https://freedomhouse.org/rss.xml",                                   name: "Freedom House",                   country: "Global" },
  { url: "https://www.iiss.org/rss",                                           name: "IISS Military Balance",           country: "Global" },
  { url: "https://www.chathamhouse.org/rss.xml",                               name: "Chatham House",                   country: "Global" },
  { url: "https://carnegieendowment.org/rss/articles",                         name: "Carnegie Endowment",              country: "Global" },
  { url: "https://www.brookings.edu/feed/",                                    name: "Brookings Institution",           country: "Global" },
  { url: "https://www.cfr.org/rss.xml",                                        name: "Council on Foreign Relations",    country: "Global" },
];

// ── Country coordinates for map ───────────────────────────────────────────────
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  "Afghanistan": [33.93, 67.71], "Albania": [41.15, 20.17], "Algeria": [28.03, 1.66],
  "Angola": [-11.20, 17.87], "Argentina": [-38.41, -63.62], "Armenia": [40.07, 45.04],
  "Australia": [-25.27, 133.78], "Austria": [47.52, 14.55], "Azerbaijan": [40.14, 47.58],
  "Bahrain": [26.07, 50.56], "Bangladesh": [23.68, 90.36], "Belarus": [53.71, 27.95],
  "Belgium": [50.50, 4.47], "Bolivia": [-16.29, -63.59], "Bosnia": [43.92, 17.68],
  "Brazil": [-14.24, -51.93], "Burkina Faso": [12.36, -1.52], "Cambodia": [12.57, 104.99],
  "Cameroon": [7.37, 12.35], "Canada": [56.13, -106.35], "Chad": [15.45, 18.73],
  "Chile": [-35.68, -71.54], "China": [35.86, 104.20], "Colombia": [4.57, -74.30],
  "Congo": [-0.23, 15.83], "Cuba": [21.52, -77.78], "Cyprus": [35.13, 33.43],
  "Czech Republic": [49.82, 15.47], "Denmark": [56.26, 9.50], "DR Congo": [-4.04, 21.76],
  "Ecuador": [-1.83, -78.18], "Egypt": [26.82, 30.80], "El Salvador": [13.79, -88.90],
  "Estonia": [58.60, 25.01], "Ethiopia": [9.15, 40.49], "Finland": [61.92, 25.75],
  "France": [46.23, 2.21], "Georgia": [42.32, 43.36], "Germany": [51.17, 10.45],
  "Ghana": [7.95, -1.02], "Greece": [39.07, 21.82], "Guatemala": [15.78, -90.23],
  "Guinea": [11.80, -15.18], "Haiti": [18.97, -72.29], "Honduras": [15.20, -86.24],
  "Hungary": [47.16, 19.50], "India": [20.59, 78.96], "Indonesia": [-0.79, 113.92],
  "Iran": [32.43, 53.69], "Iraq": [33.22, 43.68], "Ireland": [53.41, -8.24],
  "Israel": [31.05, 34.85], "Italy": [41.87, 12.57], "Ivory Coast": [7.54, -5.55],
  "Jamaica": [18.11, -77.30], "Japan": [36.20, 138.25], "Jordan": [30.59, 36.24],
  "Kazakhstan": [48.02, 66.92], "Kenya": [-0.02, 37.91], "Kosovo": [42.60, 20.90],
  "Kuwait": [29.31, 47.48], "Kyrgyzstan": [41.20, 74.77], "Laos": [19.86, 102.50],
  "Latvia": [56.88, 24.60], "Lebanon": [33.85, 35.86], "Libya": [26.34, 17.23],
  "Lithuania": [55.17, 23.88], "Madagascar": [-18.77, 46.87], "Malaysia": [4.21, 109.51],
  "Mali": [17.57, -3.99], "Mexico": [23.63, -102.55], "Moldova": [47.41, 28.37],
  "Morocco": [31.79, -7.09], "Mozambique": [-18.66, 35.53], "Myanmar": [21.92, 95.96],
  "Nepal": [28.39, 84.12], "Netherlands": [52.13, 5.29], "New Zealand": [-40.90, 174.89],
  "Nicaragua": [12.87, -85.21], "Niger": [17.61, 8.08], "Nigeria": [9.08, 8.68],
  "North Korea": [40.34, 127.51], "Norway": [60.47, 8.47], "Oman": [21.00, 57.00],
  "Pakistan": [30.38, 69.35], "Palestine": [31.95, 35.23], "Panama": [8.54, -80.78],
  "Paraguay": [-23.44, -58.44], "Peru": [-9.19, -75.02], "Philippines": [12.88, 121.77],
  "Poland": [51.92, 19.15], "Portugal": [39.40, -8.22], "Qatar": [25.35, 51.18],
  "Romania": [45.94, 24.97], "Russia": [61.52, 105.32], "Rwanda": [-1.94, 29.87],
  "Saudi Arabia": [23.89, 45.08], "Senegal": [14.50, -14.45], "Serbia": [44.02, 21.01],
  "Sierra Leone": [8.46, -11.78], "Singapore": [1.35, 103.82], "Somalia": [5.15, 46.20],
  "South Africa": [-30.56, 22.94], "South Korea": [35.91, 127.77], "South Sudan": [6.88, 31.31],
  "Spain": [40.46, -3.75], "Sri Lanka": [7.87, 80.77], "Sudan": [12.86, 30.22],
  "Sweden": [60.13, 18.64], "Switzerland": [46.82, 8.23], "Syria": [34.80, 38.10],
  "Taiwan": [23.70, 121.00], "Tajikistan": [38.86, 71.28], "Tanzania": [-6.37, 34.89],
  "Thailand": [15.87, 100.99], "Tunisia": [33.89, 9.54], "Turkey": [38.96, 35.24],
  "Turkmenistan": [38.97, 59.56], "Uganda": [1.37, 32.29], "Ukraine": [48.38, 31.17],
  "United Arab Emirates": [23.42, 53.85], "United Kingdom": [55.38, -3.44],
  "United States": [37.09, -95.71], "Uruguay": [-32.52, -55.77],
  "Uzbekistan": [41.38, 64.59], "Venezuela": [6.42, -66.59], "Vietnam": [14.06, 108.28],
  "Yemen": [15.55, 48.52], "Zambia": [-13.13, 27.85], "Zimbabwe": [-19.02, 29.15],
  // Regions
  "Global": [20, 0], "Africa": [8.78, 34.51], "Asia": [34.05, 100.62],
  "Middle East": [29.31, 42.45], "Latin America": [-8.78, -55.49], "Europe": [54.53, 15.26],
  "South Asia": [20.59, 78.96], "Balkans": [43.92, 17.68], "Caucasus": [42.00, 44.00],
  "Caribbean": [18.97, -72.29], "Central Asia": [41.00, 63.00],
};

// ── State ────────────────────────────────────────────────────────────────────
export let scraperState = {
  isRunning: false,
  lastRun: null as Date | null,
  nextRun: null as Date | null,
  totalIncidentsScraped: 0,
  sourcesConfigured: NEWS_SOURCES.length,
  errors: [] as string[],
};

// ── Country keyword list (ordered most-specific first, multi-word before single-word) ──
const COUNTRY_LIST = [
  // Multi-word countries first (prevent partial matches)
  "Burkina Faso", "DR Congo", "El Salvador", "Ivory Coast", "North Korea",
  "Saudi Arabia", "Sierra Leone", "South Africa", "South Korea", "South Sudan",
  "Sri Lanka", "United Arab Emirates", "United Kingdom", "United States",
  "New Zealand", "Czech Republic", "Dominican Republic", "Papua New Guinea",
  "Trinidad and Tobago", "Bosnia and Herzegovina", "Central African Republic",

  // Abbreviations / common aliases
  "UAE", "UK", "USA", "DPRK", "DRC",

  // Single-word countries
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus",
  "Belgium", "Belize", "Benin", "Bolivia", "Bosnia", "Botswana", "Brazil",
  "Brunei", "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chad", "Chile",
  "China", "Colombia", "Congo", "Croatia", "Cuba", "Cyprus", "Denmark",
  "Ecuador", "Egypt", "Estonia", "Ethiopia", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guinea",
  "Haiti", "Honduras", "Hungary", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Liberia", "Libya", "Lithuania", "Madagascar", "Malawi", "Malaysia", "Mali",
  "Mexico", "Moldova", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nepal", "Netherlands", "Nicaragua", "Niger",
  "Nigeria", "Norway", "Oman", "Pakistan", "Palestine", "Panama", "Paraguay",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Rwanda", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia",
  "Somalia", "Spain", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tunisia", "Turkey",
  "Turkmenistan", "Uganda", "Ukraine", "Uruguay", "Uzbekistan", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe",

  // Major cities → used as aliases to detect countries
  // Pakistan
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Quetta", "Multan", "Faisalabad",
  // India
  "Mumbai", "Delhi", "Kolkata", "Chennai", "Bangalore", "Hyderabad", "Ahmadabad",
  // Afghanistan
  "Kabul", "Kandahar", "Herat", "Mazar-i-Sharif",
  // Middle East
  "Baghdad", "Tehran", "Beirut", "Amman", "Damascus", "Riyadh", "Dubai", "Abu Dhabi",
  "Gaza", "Ramallah", "Sanaa", "Aden", "Muscat", "Doha", "Manama", "Kuwait City",
  // Africa
  "Cairo", "Nairobi", "Lagos", "Abuja", "Accra", "Addis Ababa", "Kampala", "Dar es Salaam",
  "Johannesburg", "Cape Town", "Mogadishu", "Khartoum", "Tripoli", "Tunis", "Rabat",
  "Casablanca", "Kinshasa", "Dakar", "Harare", "Lusaka", "Maputo", "Luanda",
  // Europe
  "Kyiv", "Kiev", "Moscow", "London", "Paris", "Berlin", "Rome", "Madrid",
  "Warsaw", "Belgrade", "Minsk", "Tbilisi", "Baku", "Yerevan", "Chisinau",
  // East Asia
  "Beijing", "Shanghai", "Hong Kong", "Seoul", "Tokyo", "Taipei", "Pyongyang",
  // Southeast Asia
  "Bangkok", "Manila", "Jakarta", "Kuala Lumpur", "Singapore", "Hanoi", "Ho Chi Minh",
  "Yangon", "Phnom Penh", "Vientiane",
  // Americas
  "Ankara", "Bogota", "Lima", "Santiago", "Buenos Aires", "Caracas", "Havana",
  "Mexico City", "Tegucigalpa", "San Salvador", "Guatemala City", "Managua",
  "Port-au-Prince", "Kingston",
];

// Alias map — maps keywords/city names to country names
const COUNTRY_ALIASES: Record<string, string> = {
  // Country aliases
  "UK": "United Kingdom", "UAE": "United Arab Emirates", "USA": "United States",
  "DPRK": "North Korea", "DRC": "DR Congo", "Bosnia": "Bosnia and Herzegovina",

  // Pakistan cities
  "Karachi": "Pakistan", "Lahore": "Pakistan", "Islamabad": "Pakistan",
  "Rawalpindi": "Pakistan", "Peshawar": "Pakistan", "Quetta": "Pakistan",
  "Multan": "Pakistan", "Faisalabad": "Pakistan",

  // India cities
  "Mumbai": "India", "Delhi": "India", "Kolkata": "India", "Chennai": "India",
  "Bangalore": "India", "Hyderabad": "India", "Ahmadabad": "India",

  // Afghanistan cities
  "Kabul": "Afghanistan", "Kandahar": "Afghanistan", "Herat": "Afghanistan",
  "Mazar-i-Sharif": "Afghanistan",

  // Middle East cities
  "Baghdad": "Iraq", "Tehran": "Iran", "Beirut": "Lebanon", "Amman": "Jordan",
  "Damascus": "Syria", "Riyadh": "Saudi Arabia", "Dubai": "United Arab Emirates",
  "Abu Dhabi": "United Arab Emirates", "Gaza": "Palestine", "Ramallah": "Palestine",
  "Sanaa": "Yemen", "Aden": "Yemen", "Muscat": "Oman", "Doha": "Qatar",
  "Manama": "Bahrain", "Kuwait City": "Kuwait",

  // Africa cities
  "Cairo": "Egypt", "Nairobi": "Kenya", "Lagos": "Nigeria", "Abuja": "Nigeria",
  "Accra": "Ghana", "Addis Ababa": "Ethiopia", "Kampala": "Uganda",
  "Dar es Salaam": "Tanzania", "Johannesburg": "South Africa",
  "Cape Town": "South Africa", "Mogadishu": "Somalia", "Khartoum": "Sudan",
  "Tripoli": "Libya", "Tunis": "Tunisia", "Rabat": "Morocco",
  "Casablanca": "Morocco", "Kinshasa": "DR Congo", "Dakar": "Senegal",
  "Harare": "Zimbabwe", "Lusaka": "Zambia", "Maputo": "Mozambique",
  "Luanda": "Angola",

  // Europe cities
  "Kyiv": "Ukraine", "Kiev": "Ukraine", "Moscow": "Russia", "London": "United Kingdom",
  "Paris": "France", "Berlin": "Germany", "Rome": "Italy", "Madrid": "Spain",
  "Warsaw": "Poland", "Belgrade": "Serbia", "Minsk": "Belarus",
  "Tbilisi": "Georgia", "Baku": "Azerbaijan", "Yerevan": "Armenia",
  "Chisinau": "Moldova",

  // East Asia
  "Beijing": "China", "Shanghai": "China", "Hong Kong": "China", "Seoul": "South Korea",
  "Tokyo": "Japan", "Taipei": "Taiwan", "Pyongyang": "North Korea",

  // Southeast Asia
  "Bangkok": "Thailand", "Manila": "Philippines", "Jakarta": "Indonesia",
  "Kuala Lumpur": "Malaysia", "Hanoi": "Vietnam", "Ho Chi Minh": "Vietnam",
  "Yangon": "Myanmar", "Phnom Penh": "Cambodia", "Vientiane": "Laos",

  // Americas
  "Ankara": "Turkey", "Bogota": "Colombia", "Lima": "Peru", "Santiago": "Chile",
  "Buenos Aires": "Argentina", "Caracas": "Venezuela", "Havana": "Cuba",
  "Mexico City": "Mexico", "Tegucigalpa": "Honduras", "San Salvador": "El Salvador",
  "Guatemala City": "Guatemala", "Managua": "Nicaragua",
  "Port-au-Prince": "Haiti", "Kingston": "Jamaica",
};

function detectCountry(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();

  for (const name of COUNTRY_LIST) {
    // Match whole word (surrounded by space, comma, period, or start/end)
    const re = new RegExp(`(?<![a-z])${name.toLowerCase()}(?![a-z])`, "i");
    if (re.test(text)) {
      return COUNTRY_ALIASES[name] ?? name;
    }
  }
  return null;
}

// ── XML helpers ───────────────────────────────────────────────────────────────
function extractXmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "si"));
  return match ? match[1].trim() : "";
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ").trim();
}

async function fetchRssFeed(url: string, sourceName: string, sourceCountry: string): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "GlobeWatch360/1.0 (+https://globewatch360.com)" },
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const text = await response.text();

    const items: RssItem[] = [];
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/gi);

    for (const match of itemMatches) {
      const xml = match[1];
      const title = cleanText(extractXmlTag(xml, "title"));
      const desc  = cleanText(extractXmlTag(xml, "description"));
      const link  = extractXmlTag(xml, "link").trim() || extractXmlTag(xml, "guid").trim();
      const date  = extractXmlTag(xml, "pubDate") || extractXmlTag(xml, "dc:date");

      if (title && link) {
        items.push({ title, description: desc, link, pubDate: date, source: sourceName, sourceCountry });
      }
    }

    return items.slice(0, 25);
  } catch {
    return [];
  }
}

// ── Main scrape ───────────────────────────────────────────────────────────────
export async function runScrape(): Promise<{
  incidentsFound: number;
  incidentsAdded: number;
  sourcesScraped: number;
  errors: string[];
}> {
  scraperState.isRunning = true;
  scraperState.errors = [];

  let incidentsFound = 0, incidentsAdded = 0, sourcesScraped = 0;
  const errors: string[] = [];

  try {
    for (const source of NEWS_SOURCES) {
      const items = await fetchRssFeed(source.url, source.name, source.country);
      if (items.length > 0) sourcesScraped++;

      for (const item of items) {
        incidentsFound++;

        const urlHash = createHash("md5").update(item.link).digest("hex");
        const existing = await db.select({ id: incidentsTable.id })
          .from(incidentsTable).where(eq(incidentsTable.urlHash, urlHash)).limit(1);
        if (existing.length > 0) continue;

        // Always try to detect a specific country from article text
        const detectedCountry = detectCountry(item.title, item.description);

        // Use: detected specific country > source country (if not a generic region) > fallback
        let country: string;
        if (detectedCountry) {
          country = detectedCountry;
        } else if (!["Global", "Africa", "Asia", "Europe", "Middle East", "Latin America", "South Asia"].includes(source.country)) {
          // Source is already country-specific (e.g. "Pakistan", "Nigeria")
          country = source.country;
        } else {
          // Regional source with no specific country detected — keep regional label
          country = source.country;
        }

        const category = classifyCategory(item.title, item.description);
        const riskLevel = classifyRiskLevel(item.title, item.description, category);
        const tags = extractTags(item.title, item.description, country);
        const aiSummary = generateAiSummary(item.title, item.description, category, riskLevel, country);
        const coords = COUNTRY_COORDINATES[country] ?? COUNTRY_COORDINATES["Global"]!;

        let publishedAt: Date;
        try {
          publishedAt = new Date(item.pubDate);
          if (isNaN(publishedAt.getTime())) publishedAt = new Date();
        } catch {
          publishedAt = new Date();
        }

        await db.insert(incidentsTable).values({
          title: item.title.slice(0, 500),
          summary: item.description.slice(0, 1000) || item.title,
          fullContent: item.description,
          sourceUrl: item.link,
          sourceName: item.source,
          country,
          latitude: coords[0],
          longitude: coords[1],
          category,
          riskLevel,
          isVerified: false,
          isOngoing: riskLevel === "Ongoing",
          publishedAt,
          tags,
          aiSummary,
          urlHash,
        }).onConflictDoNothing();

        incidentsAdded++;
        scraperState.totalIncidentsScraped++;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    scraperState.errors.push(msg);
  }

  scraperState.isRunning = false;
  scraperState.lastRun = new Date();
  scraperState.nextRun = new Date(Date.now() + 30 * 60 * 1000);

  return { incidentsFound, incidentsAdded, sourcesScraped, errors };
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (schedulerInterval) return;
  runScrape().catch(console.error);
  schedulerInterval = setInterval(() => { runScrape().catch(console.error); }, 30 * 60 * 1000);
  scraperState.nextRun = new Date(Date.now() + 30 * 60 * 1000);
}
