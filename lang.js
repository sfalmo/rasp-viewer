import dictEn from './lang/en.json';
import dictDe from './lang/de.json';

function browserLocales(languageCodeOnly = true) {
  return navigator.languages.map((locale) =>
    languageCodeOnly ? locale.split("-")[0] : locale,
  );
}

var validLangs = ["en", "de"];

var langPreferences = [localStorage.getItem("lang"), ...browserLocales(true)];
var validLangPreferences = langPreferences.filter(l => validLangs.includes(l));
var lang = validLangPreferences.length > 0 ? validLangPreferences[0] : "en";
var loadedDict = dictEn;
if (lang == "de") {
    loadedDict = dictDe;
}

document.documentElement.lang = lang;

export default function dict(key) {
    return loadedDict[key] ? loadedDict[key] : key;
}
