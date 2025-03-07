import React, { useState } from 'react';
import Swal from 'sweetalert2';
import '../../styles/footer.css';
import surpriseImage from '../../media/easteregg.png';
import mharnes from '../../media/mharnes.png';
import donemilio from '../../media/DonEmilio.png';
import duyamis  from '../../media/DuyAmis.png';


export const Footer = () => {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if(newCount >= 10){
      Swal.fire({
        title: '🎉 Felicitaciones 🎉',
        text: '¡Lo encontraste!',
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
      <div className="">
        <small>
          © 2025 Powered by Don Emilio<span onClick={handleClick} style={{userSelect: 'none', cursor: 'pointer'}}> DEVs</span>. Todos los derechos reservados.
        </small>
      </div>  
      <div className="d-flex w-100 justify-content-center align-items-center">
        <img src={mharnes} className="img-footer-GM" alt="" />
        <img src={donemilio} className="img-footer-DE" alt="" />
        <img src={duyamis} className="img-footer-DA" alt="" />
      </div>
    </footer>
  );
};
