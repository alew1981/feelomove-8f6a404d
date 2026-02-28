/**
 * destinoFaqGenerator.ts
 *
 * Genera preguntas frecuentes (FAQPage schema) para páginas de destino.
 * Las preguntas se generan automáticamente a partir de datos de la ciudad.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface GenerateDestinoFAQsParams {
  cityName: string;
  eventCount: number;
  nextEventName?: string;
  nextEventDate?: string;
  locale: 'es' | 'en';
}

function formatDateLong(isoDate: string, locale: 'es' | 'en'): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';

    if (locale === 'en') {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  } catch {
    return '';
  }
}

/**
 * Genera entre 3 y 5 preguntas frecuentes para una página de destino.
 */
export function generateDestinoFAQs(params: GenerateDestinoFAQsParams): FAQItem[] {
  const { cityName, eventCount, nextEventName, nextEventDate, locale } = params;
  const faqs: FAQItem[] = [];
  const isES = locale === 'es';

  // 1. ¿Qué conciertos hay en [ciudad]? — Siempre
  faqs.push(
    isES
      ? {
          question: `¿Qué conciertos hay en ${cityName}?`,
          answer: `Actualmente hay ${eventCount} eventos disponibles en ${cityName}. Consulta la programación completa en Feelomove para descubrir todos los conciertos y festivales próximos en la ciudad.`,
        }
      : {
          question: `What concerts are there in ${cityName}?`,
          answer: `There are currently ${eventCount} events available in ${cityName}. Check the full schedule on Feelomove to discover all upcoming concerts and festivals in the city.`,
        },
  );

  // 2. ¿Cuál es el próximo concierto? — Solo si hay datos
  if (nextEventName) {
    const datePart = nextEventDate
      ? (() => {
          const formatted = formatDateLong(nextEventDate, locale);
          return formatted
            ? isES ? `, programado para el ${formatted}` : `, scheduled for ${formatted}`
            : '';
        })()
      : '';

    faqs.push(
      isES
        ? {
            question: `¿Cuál es el próximo concierto en ${cityName}?`,
            answer: `El próximo evento en ${cityName} es ${nextEventName}${datePart}. Compra tus entradas en Feelomove antes de que se agoten.`,
          }
        : {
            question: `What is the next concert in ${cityName}?`,
            answer: `The next event in ${cityName} is ${nextEventName}${datePart}. Get your tickets on Feelomove before they sell out.`,
          },
    );
  }

  // 3. ¿Cómo comprar entradas? — Siempre
  faqs.push(
    isES
      ? {
          question: `¿Cómo comprar entradas para conciertos en ${cityName}?`,
          answer: `Puedes comprar entradas para conciertos en ${cityName} directamente en Feelomove. Selecciona el evento que te interese, elige tu tipo de entrada y completa la compra en pocos pasos de forma segura.`,
        }
      : {
          question: `How to buy tickets for concerts in ${cityName}?`,
          answer: `You can buy tickets for concerts in ${cityName} directly on Feelomove. Select the event you're interested in, choose your ticket type and complete the purchase securely in a few steps.`,
        },
  );

  // 4. ¿Hay hoteles cerca? — Siempre
  faqs.push(
    isES
      ? {
          question: `¿Hay hoteles cerca de los conciertos en ${cityName}?`,
          answer: `Sí, en Feelomove puedes reservar hoteles cerca de los recintos de conciertos en ${cityName}. Ofrecemos paquetes de entrada + hotel para que disfrutes de la experiencia completa sin preocuparte por el alojamiento.`,
        }
      : {
          question: `Are there hotels near concert venues in ${cityName}?`,
          answer: `Yes, on Feelomove you can book hotels near concert venues in ${cityName}. We offer ticket + hotel packages so you can enjoy the complete experience without worrying about accommodation.`,
        },
  );

  return faqs;
}
