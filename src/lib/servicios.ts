import { SIN_360 } from './previa';
import imgBranding1 from '../assets/home/home-branding-1.png';
import imgBranding2 from '../assets/home/home-branding-2.png';
import imgBranding3 from '../assets/home/home-branding-3.png';
import imgWeb1 from '../assets/home/home-web-1.png';
import imgWeb2 from '../assets/home/home-web-2.png';
import imgWeb3 from '../assets/home/home-web-3.png';
import img360_1 from '../assets/home/home-360-1.png';
import img360_2 from '../assets/home/home-360-2.png';
import img360_3 from '../assets/home/home-360-3.png';

/**
 * Los tres servicios, con su destino, su color de hover y la nube de
 * etiquetas. Los usan la home y la página de servicios: el contenido es el
 * mismo en los dos lados, así que vive acá y no en cada página.
 *
 * `marca` marca el bloque que lleva el logo de 360 al margen; `remate` es la
 * segunda línea de la bajada, en verde.
 */
export interface Servicio {
  titulo: string;
  /* Sin `href` el bloque deja de ser un enlace: es lo que pasa con 360 en el
     build de previa, donde esa página no se publica. */
  href?: string;
  color: string;
  /* Imagen que llena la mancha del bloque, detrás de la máscara. Sin imagen,
     la mancha queda con el color plano del servicio. Con varias, rotan en
     loop mientras el puntero está sobre los bloques. */
  imagen?: ImageMetadata | ImageMetadata[];
  marca?: boolean;
  bajada: string;
  remate?: string;
  etiquetas: string[];
}

export const SERVICIOS: Servicio[] = [
  {
    titulo: 'Branding',
    href: '/servicios/branding',
    color: 'var(--color-amarillo)',
    imagen: [imgBranding1, imgBranding2, imgBranding3],
    bajada:
      'Creamos estrategias efectivas que te conectan con tus audiencias. Construimos una imagen y un discurso relevantes dándole a tu marca una personalidad única para que cuando hable, la escuchen.',
    etiquetas: [
      'Auditoría de marca',
      'Estrategia de marca',
      'Arquitectura marcaria',
      'Naming',
      'Identidad visual',
      'Identidad verbal',
      'Sistema gráfico',
      'Aplicaciones',
    ],
  },
  {
    titulo: 'Web',
    href: '/servicios/web',
    color: 'var(--color-rojo)',
    imagen: [imgWeb1, imgWeb2, imgWeb3],
    bajada:
      'Sitios y plataformas claros y rápidos, diseñados sobre tu marca, para que tu público encuentre lo que busca y termine eligiéndote.',
    etiquetas: [
      'Diseño UI /UX',
      'e-commerce',
      'Integraciones',
      'CMS Autogestionables',
      'SEO Técnico',
      'Landing Pages',
      'Mobile First',
      'Mantenimiento',
      'Optimizaciones',
    ],
  },
  {
    titulo: 'Trópico 360',
    href: SIN_360 ? undefined : '/servicios/360',
    color: 'var(--color-aqua)',
    imagen: [img360_1, img360_2, img360_3],
    marca: true,
    bajada:
      'Toda tu comunicación bajo una misma dirección. Planificamos, producimos y medimos todos los meses, con un equipo comprometido que conoce tu negocio.',
    remate: 'Un frente tropical soplando a tu favor.',
    etiquetas: [
      'Plan mensual',
      'Contenidos y redes',
      'Ads',
      'Automation',
      'CRM y embudos',
      'Evolución de marca',
      'Evolución del sitio',
      'Reporting',
      'Equipo dedicado',
    ],
  },
];
