import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

const PoliticaPrivacidad = () => {
  const { locale, localePath } = useTranslation();
  const isEN = locale === 'en';

  return (
    <>
      <SEOHead
        title={isEN ? "Privacy Policy | FEELOMOVE+" : "Política de Privacidad | FEELOMOVE+"}
        description={isEN
          ? "Learn how FEELOMOVE+ collects, uses and protects your personal data."
          : "Conoce cómo FEELOMOVE+ recoge, usa y protege tus datos personales."}
        breadcrumbs={[
          { name: isEN ? 'Home' : 'Inicio', url: localePath('/') },
          { name: isEN ? 'Privacy Policy' : 'Política de Privacidad' },
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
              {isEN ? 'Privacy Policy' : 'Política de Privacidad'}
            </h1>

            <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
              {isEN ? (
                <>
                  <p className="text-sm text-muted-foreground/70">Last updated: February 2026</p>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">1. Data Controller</h2>
                    <p>The entity responsible for processing your personal data is <strong>FEELOMOVE+</strong> ("we", "us"). You can contact us at <a href="mailto:info@feelomove.com" className="text-accent hover:underline">info@feelomove.com</a>.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">2. Data We Collect</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Browsing data:</strong> IP address, browser type, pages visited, referring URL.</li>
                      <li><strong>Cookies:</strong> We use analytics and functionality cookies (see our Cookies section).</li>
                      <li><strong>Favorites:</strong> Events you save are stored locally in your browser (localStorage). We do not collect this information on our servers.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">3. Purpose of Processing</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>To provide and improve our services.</li>
                      <li>To analyze website usage and optimize performance.</li>
                      <li>To comply with legal obligations.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">4. Legal Basis</h2>
                    <p>Data processing is based on your consent (cookies) and our legitimate interest in improving services (analytics), in accordance with the GDPR (EU Regulation 2016/679).</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">5. Data Sharing</h2>
                    <p>We do not sell your personal data. We may share information with:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Analytics providers:</strong> to measure website performance.</li>
                      <li><strong>Hosting providers:</strong> to serve our website.</li>
                      <li><strong>Ticket partners:</strong> when you click external ticket links, those third-party platforms have their own privacy policies.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
                    <p>Under the GDPR, you have the right to access, rectify, erase, restrict processing, data portability, and object to processing. Contact us at <a href="mailto:info@feelomove.com" className="text-accent hover:underline">info@feelomove.com</a>.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">7. Data Retention</h2>
                    <p>Browsing data is retained for up to 26 months. You may delete cookies at any time through your browser settings.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">8. Changes</h2>
                    <p>We may update this policy periodically. The latest version will always be available on this page.</p>
                  </section>

                  <div className="mt-8 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground/70">
                    <strong>Disclaimer:</strong> This privacy policy is provided for informational purposes and does not constitute legal advice. We recommend consulting a qualified legal professional for specific compliance requirements.
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground/70">Última actualización: febrero 2026</p>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">1. Responsable del Tratamiento</h2>
                    <p>El responsable del tratamiento de tus datos personales es <strong>FEELOMOVE+</strong> ("nosotros"). Puedes contactarnos en <a href="mailto:info@feelomove.com" className="text-accent hover:underline">info@feelomove.com</a>.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">2. Datos que Recopilamos</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas, URL de referencia.</li>
                      <li><strong>Cookies:</strong> Utilizamos cookies analíticas y de funcionalidad (consulta nuestra sección de Cookies).</li>
                      <li><strong>Favoritos:</strong> Los eventos que guardas se almacenan localmente en tu navegador (localStorage). No recopilamos esta información en nuestros servidores.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">3. Finalidad del Tratamiento</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Prestar y mejorar nuestros servicios.</li>
                      <li>Analizar el uso del sitio web y optimizar el rendimiento.</li>
                      <li>Cumplir con obligaciones legales.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">4. Base Legal</h2>
                    <p>El tratamiento de datos se basa en tu consentimiento (cookies) y nuestro interés legítimo en mejorar los servicios (analítica), conforme al RGPD (Reglamento UE 2016/679) y la LOPDGDD.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">5. Cesión de Datos</h2>
                    <p>No vendemos tus datos personales. Podemos compartir información con:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Proveedores de analítica:</strong> para medir el rendimiento del sitio.</li>
                      <li><strong>Proveedores de hosting:</strong> para servir nuestro sitio web.</li>
                      <li><strong>Partners de entradas:</strong> al hacer clic en enlaces externos de entradas, esas plataformas tienen sus propias políticas de privacidad.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">6. Tus Derechos</h2>
                    <p>Conforme al RGPD, tienes derecho de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición. Contacta con nosotros en <a href="mailto:info@feelomove.com" className="text-accent hover:underline">info@feelomove.com</a>.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">7. Conservación de Datos</h2>
                    <p>Los datos de navegación se conservan durante un máximo de 26 meses. Puedes eliminar las cookies en cualquier momento desde la configuración de tu navegador.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground">8. Modificaciones</h2>
                    <p>Podemos actualizar esta política periódicamente. La versión más reciente estará siempre disponible en esta página.</p>
                  </section>

                  <div className="mt-8 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground/70">
                    <strong>Aviso:</strong> Esta política de privacidad se proporciona con fines informativos y no constituye asesoramiento legal. Recomendamos consultar con un profesional jurídico cualificado para requisitos específicos de cumplimiento.
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

export default PoliticaPrivacidad;
