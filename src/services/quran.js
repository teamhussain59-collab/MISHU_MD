import { getJson } from '../lib/http.js';

export async function getUrduAyah(surah, ayah) {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) throw new RangeError('Surah must be 1-114.');
  if (!Number.isInteger(ayah) || ayah < 1) throw new RangeError('Ayah must be a positive integer.');
  const data = await getJson(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ur.jalandhry`);
  if (data.code !== 200 || !data.data?.text) throw new Error('Ayah not found.');
  return {
    text: data.data.text,
    surahName: data.data.surah.name,
    ayahNumber: data.data.numberInSurah,
  };
}
