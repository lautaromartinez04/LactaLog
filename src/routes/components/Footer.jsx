import React, { useState } from 'react';
import Swal from 'sweetalert2';
import '../../styles/footer.css';
import surpriseImage from '../../media/easteregg.png';
import mharnes from '../../media/mharnes.png';
import donemilio from '../../media/DonEmilio.png';
import duyamis from '../../media/DuyAmis.png';

export const Footer = () => {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if(newCount >= 10){
      Swal.fire({
        title: '🎉 Felicitaciones 🎉',
        text: 'Desarrollado por Fermin Giraudo y Lautaro Martinez',
        imageUrl: surpriseImage,
        imageWidth: 350,
        imageAlt: 'Imagen sorpresa',
        timer: 2000,
        showConfirmButton: false
      });
      setClickCount(0); // Reinicia el contador
    }
  };

  return (
    <footer className="bg-dark text-white text-center py-3 no-print">
      <div className="container">
        <div>
          <small>
            © 2025 Powered by Don Emilio<span onClick={handleClick} style={{ userSelect: 'none', cursor: 'pointer' }}> DEVs</span>. Todos los derechos reservados.
          </small>
        </div>  
        <div className="d-flex w-100 justify-content-center align-items-center flex-wrap">
          <img src={mharnes} className="img-footer-GM img-fluid mx-2" alt="" />
          <img src={donemilio} className="img-footer-DE img-fluid mx-2" alt="" />
          <img src={duyamis} className="img-footer-DA img-fluid mx-2" alt="" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
