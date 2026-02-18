import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

const TerminosUso = () => {
  const { locale, localePath } = useTranslation();
  const isEN = locale === 'en';

  return (
    <>
      <SEOHead
        title={isEN ? "Terms of Use | FEELOMOVE+" : "Términos de Uso | FEELOMOVE+"}
        description={isEN
          ? "Read the terms and conditions governing the use of FEELOMOVE+."
          : "Lee los términos y condiciones que rigen el uso de FEELOMOVE+."}
        breadcrumbs={[
          { name: isEN ? 'Home' : 'Inicio', url: localePath('/') },
          { name: isEN ? 'Terms of Use' : 'Términos de Uso' },
        ]}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="mb-4">
              <Breadcrumbs />
            </div>

            <h1 className="text-3xl font-bold mt-6 mb-8 text-foreground">
              {isEN ? 'Terms of Use' : 'Términos de Uso'}
            </h1>

            <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
              {isEN ? (
                <>
                  <p className="text-sm text-muted-foreground/70">Last updated: February 2026</p>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">1. About FEELOMOVE+</h2>
                    <p>FEELOMOVE+ is a concert and festival information platform that helps users discover live music events in Spain and find nearby accommodation. We are an <strong>information aggregator</strong> — we do not sell tickets or accommodation directly.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">2. Acceptance of Terms</h2>
                    <p>By accessing and using this website, you accept these terms in full. If you disagree with any part, please do not use the site.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">3. Our Services</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Event listings:</strong> We display concert and festival information sourced from official ticketing platforms.</li>
                      <li><strong>Hotel suggestions:</strong> We show nearby accommodation options with indicative prices.</li>
                      <li><strong>External links:</strong> Clicking on ticket or hotel links will redirect you to third-party websites (e.g., Ticketmaster). Purchases are governed by those platforms' terms.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">4. Disclaimer</h2>
                    <p>Event information (dates, prices, availability) is provided "as is" and may change without notice. We strive for accuracy but <strong>cannot guarantee</strong> that all information is current or complete. Always verify details on the official ticketing platform before purchasing.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
                    <p>All original content, design, and code on FEELOMOVE+ are our intellectual property. Event images and artist names belong to their respective owners and are used for informational purposes.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
                    <p>FEELOMOVE+ shall not be liable for any damages arising from:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Inaccurate or outdated event information.</li>
                      <li>Issues with purchases made on third-party platforms.</li>
                      <li>Service interruptions or technical errors.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">7. User Conduct</h2>
                    <p>You agree not to misuse our services, including automated scraping, unauthorized access attempts, or any activity that could harm the platform or its users.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">8. Governing Law</h2>
                    <p>These terms are governed by Spanish law. Any disputes shall be submitted to the courts of Madrid, Spain.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">9. Changes</h2>
                    <p>We reserve the right to modify these terms at any time. Continued use of the site constitutes acceptance of updated terms.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
                    <p>For questions about these terms, contact us at <a href="mailto:info@feelomove.com" className="text-accent hover:underline">info@feelomove.com</a>.</p>
                  </section>

                  <div className="mt-8 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground/70">
                    <strong>Disclaimer:</strong> These terms are provided for informational purposes and do not constitute legal advice. We recommend consulting a qualified legal professional for specific compliance requirements.
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground/70">Última actualización: febrero 2026</p>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">1. Sobre FEELOMOVE+</h2>
                    <p>FEELOMOVE+ es una plataforma de información sobre conciertos y festivales que ayuda a los usuarios a descubrir eventos de música en vivo en España y encontrar alojamiento cercano. Somos un <strong>agregador de información</strong> — no vendemos entradas ni alojamiento directamente.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">2. Aceptación de los Términos</h2>
                    <p>Al acceder y utilizar este sitio web, aceptas estos términos en su totalidad. Si no estás de acuerdo con alguna parte, por favor no uses el sitio.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">3. Nuestros Servicios</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Listados de eventos:</strong> Mostramos información de conciertos y festivales obtenida de plataformas oficiales de venta de entradas.</li>
                      <li><strong>Sugerencias de hotel:</strong> Mostramos opciones de alojamiento cercano con precios orientativos.</li>
                      <li><strong>Enlaces externos:</strong> Al hacer clic en enlaces de entradas u hoteles serás redirigido a sitios web de terceros (ej. Ticketmaster). Las compras se rigen por los términos de esas plataformas.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">4. Exención de Responsabilidad</h2>
                    <p>La información sobre eventos (fechas, precios, disponibilidad) se proporciona "tal cual" y puede cambiar sin previo aviso. Nos esforzamos por la precisión pero <strong>no podemos garantizar</strong> que toda la información esté actualizada o completa. Verifica siempre los detalles en la plataforma oficial antes de comprar.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">5. Propiedad Intelectual</h2>
                    <p>Todo el contenido original, diseño y código de FEELOMOVE+ son nuestra propiedad intelectual. Las imágenes de eventos y nombres de artistas pertenecen a sus respectivos propietarios y se utilizan con fines informativos.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">6. Limitación de Responsabilidad</h2>
                    <p>FEELOMOVE+ no será responsable de daños derivados de:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Información de eventos inexacta o desactualizada.</li>
                      <li>Problemas con compras realizadas en plataformas de terceros.</li>
                      <li>Interrupciones del servicio o errores técnicos.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">7. Conducta del Usuario</h2>
                    <p>Te comprometes a no hacer un uso indebido de nuestros servicios, incluyendo scraping automatizado, intentos de acceso no autorizado o cualquier actividad que pueda perjudicar la plataforma o sus usuarios.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">8. Legislación Aplicable</h2>
                    <p>Estos términos se rigen por la legislación española. Cualquier controversia se someterá a los juzgados y tribunales de Madrid, España.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">9. Modificaciones</h2>
                    <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado del sitio implica la aceptación de los términos actualizados.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">10. Contacto</h2>
                    <p>Para dudas sobre estos términos, contacta con nosotros en <a href="mailto:info@feelomove.com" className="text-accent hover:underline">info@feelomove.com</a>.</p>
                  </section>

                  <div className="mt-8 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground/70">
                    <strong>Aviso:</strong> Estos términos se proporcionan con fines informativos y no constituyen asesoramiento legal. Recomendamos consultar con un profesional jurídico cualificado para requisitos específicos de cumplimiento.
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default TerminosUso;
