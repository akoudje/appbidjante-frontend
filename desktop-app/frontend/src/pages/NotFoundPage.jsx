// File: src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  MapPin, 
  Users, 
  FileText, 
  ArrowLeft,
  Compass
} from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen-dynamic bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-stone-900 dark:to-amber-950 flex flex-col items-center justify-center p-4">
      {/* Texture papier subtile */}
      <div className="absolute inset-0 texture-paper opacity-30"></div>
      
      {/* Contenu principal */}
      <div className="relative z-10 max-w-2xl w-full text-center animate-fadeIn">
        
        {/* Numéro 404 stylisé */}
        <div className="relative mb-8">
          <div className="text-[12rem] md:text-[15rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 dark:from-amber-500 dark:via-orange-500 dark:to-amber-600 opacity-20">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-400 dark:to-orange-400">
              404
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 dark:text-stone-100 mb-4">
            Page Non Trouvée
          </h2>
          <p className="text-lg text-stone-600 dark:text-stone-300 mb-6 max-w-lg mx-auto">
            La page que vous recherchez semble s'être perdue dans les chemins de terre de notre village.
            Peut-être a-t-elle pris un sentier différent...
          </p>          
 
        </div>

        {/* Bouton de retour */}
        <div className="mb-12">
          <Link 
            to="/"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-700 dark:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:from-amber-700 hover:to-orange-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Retourner à l'accueil
          </Link>
        </div>

      </div>

      {/* Éléments décoratifs */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
  
    </div>
  );
};

export default NotFoundPage;