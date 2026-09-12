export default function handler(_req, res) {
  res.status(200).json({
    version: "1.0.4",
    url: "https://skaneo.vercel.app/api/download",
    notes:
      "Nouveau : notification push pour les nouvelles versions de l'application.\n\n" +
      "Correction : correction d'un bug qui empêchait la détection de texte sur certaines images.\n\n" +
      "Amélioration : amélioration de la vitesse de traitement des images pour une meilleure expérience utilisateur.",
  });
}
