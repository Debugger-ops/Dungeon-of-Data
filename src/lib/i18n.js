// Interface language. Only the navigation and a few headings are translated; game text stays in English.
export const LANGS = [['en', 'English'], ['hi', 'हिन्दी']]
const HI = {
  Play: 'खेलें', 'Arrays and search': 'ऐरे और सर्च', 'Lists and stacks': 'लिस्ट और स्टैक', 'Trees and graphs': 'ट्री और ग्राफ', Skills: 'कौशल', Progress: 'प्रगति',
  Map: 'नक्शा', Campaign: 'अभियान', Daily: 'दैनिक', 'Boss Rush': 'बॉस रश', Weekly: 'साप्ताहिक', Endless: 'अंतहीन', Speedrun: 'स्पीडरन', 'Sorting Race': 'सॉर्टिंग रेस',
  'Sorting Hall': 'सॉर्टिंग हॉल', 'Binary Vault': 'बाइनरी वॉल्ट', 'Pattern Match': 'पैटर्न मैच', 'Bit Bunker': 'बिट बंकर', 'Big-O Blitz': 'बिग-ओ ब्लिट्ज',
  'Linked List Lab': 'लिंक्ड लिस्ट लैब', 'The Keep': 'द कीप', 'Stack Defender': 'स्टैक डिफेंडर', 'Hash Forge': 'हैश फोर्ज', 'Trie Tunnel': 'ट्राई टनल', 'Union Yard': 'यूनियन यार्ड',
  'Backtrack Bastion': 'बैकट्रैक बैस्टियन', 'Heap Hollow': 'हीप होलो', 'Root Crypt': 'रूट क्रिप्ट', Labyrinth: 'भूलभुलैया', 'Graph Builder': 'ग्राफ बिल्डर', 'DP Dungeon': 'डीपी डंजन',
  'Scribe Tower': 'स्क्राइब टावर', 'Bug Hunt': 'बग हंट', 'Memory Match': 'मेमोरी मैच', Leaderboard: 'लीडरबोर्ड', Quiz: 'क्विज़', Review: 'रिव्यू', Interview: 'इंटरव्यू',
  Visualizer: 'विज़ुअलाइज़र', Shop: 'दुकान', Analytics: 'विश्लेषण', Tome: 'ग्रंथ', Ledger: 'बही-खाता', Settings: 'सेटिंग्स', Challenge: 'चुनौती', 'Cheat sheet': 'चीट शीट',
}
const TABLES = { hi: HI }
export const tr = (lang, s) => (TABLES[lang] && TABLES[lang][s]) || s
