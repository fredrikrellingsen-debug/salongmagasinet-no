import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PUBLISHERS = [
  {
    domain: 'norgesmagasinet.no',
    name: 'Norgesmagasinet',
    tags: ['næringsliv', 'samfunn', 'helse', 'livsstil', 'innovasjon'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'auton.no',
    name: 'Auton',
    tags: ['bil', 'elbil', 'mobilitet', 'lading', 'bilhold', 'testguider'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'borettslagsavtalen.no',
    name: 'Borettslagsavtalen',
    tags: ['borettslag', 'sameie', 'styrearbeid', 'vedlikehold', 'energi', 'leverandøravtaler'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'bransjeaktuelt.no',
    name: 'Bransjeaktuelt',
    tags: ['industri', 'bygg', 'anlegg', 'logistikk', 'transport', 'HMS'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'franchisepartner.no',
    name: 'Franchisepartner',
    tags: ['franchise', 'kjededrift', 'detaljhandel', 'vekst', 'partnerskap'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'idrettdugnad.no',
    name: 'Idrettdugnad',
    tags: ['idrettslag', 'frivillighet', 'dugnad', 'utstyr', 'lokalsponsorat'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'kursmarkedet-team.no',
    name: 'Kursmarkedet',
    tags: ['kurs', 'sertifisering', 'kompetanseheving', 'HR', 'lederutvikling'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'needoh.no',
    name: 'Needoh',
    tags: ['forbrukerprodukter', 'livsstil', 'trender', 'hverdagsgleder', 'kjøpsguider'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'xn--nringspulsen-6cb.no',
    name: 'Næringspulsen',
    tags: ['næringsliv', 'økonomi', 'finans', 'ledelse', 'regnskap', 'børs'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'oppussingsnytt.no',
    name: 'Oppussingsnytt',
    tags: ['oppussing', 'håndverk', 'bolig', 'VVS', 'elektro', 'maling', 'interiør'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'vekstmotoren.no',
    name: 'Vekstmotoren',
    tags: ['vekst', 'markedsføring', 'salg', 'SEO', 'gründer', 'bedrift'],
    adsEnabled: true,
    leadsEnabled: true,
  },
  {
    domain: 'sponset.no',
    name: 'Sponset',
    tags: ['sponsing', 'kommersielt innhold', 'merkevaresamarbeid', 'kampanjer'],
    adsEnabled: true,
    leadsEnabled: true,
  },
];

async function main() {
  console.log('Starter seeding av 12 domener...');

  for (const pub of PUBLISHERS) {
    await prisma.publisher.upsert({
      where: { domain: pub.domain },
      update: {
        name: pub.name,
        tags: pub.tags,
        adsEnabled: pub.adsEnabled,
        leadsEnabled: pub.leadsEnabled,
      },
      create: {
        domain: pub.domain,
        name: pub.name,
        tags: pub.tags,
        adsEnabled: pub.adsEnabled,
        leadsEnabled: pub.leadsEnabled,
      },
    });
  }

  const customer = await prisma.customer.upsert({
    where: { id: 'cust-innovasjon-norge' },
    update: {},
    create: {
      id: 'cust-innovasjon-norge',
      companyName: 'Nordisk Industripartner',
      description: 'Norsk rådgivnings- og teknologimiljø for grønn omstilling og effektivisering.',
      tags: ['Innovasjon', 'Næringsliv', 'Samfunn'],
      subscriptionTier: 'pro',
    },
  });

  const publisher = await prisma.publisher.findUnique({
    where: { domain: 'norgesmagasinet.no' },
  });

  if (publisher) {
    await prisma.article.upsert({
      where: { id: 'norway-tech-innovation' },
      update: {
        content: `
          <p><img src="/images/hero.webp" alt="Nordisk innovasjon og næringsliv" /></p>
          <h2>Omstilling starter med tydelige grep</h2>
          <p>Norske virksomheter står midt i et teknologisk og energimessig skifte. Over hele landet jobbes det med å kombinere solid industrierfaring med smartere digitale verktøy og energieffektive løsninger.</p>
          <blockquote>"Nøkkelen ligger i å omsette praktisk bransjekunnskap til løsninger som faktisk fungerer i hverdagen for norske bedrifter."</blockquote>
          <h2>Smartere energibruk og lokal verdiskaping</h2>
          <p>Ved å måle og styre energiforbruket mer presist kan både produksjonsbedrifter og næringsbygg redusere unødvendig svinn betydelig, samtidig som driftskostnadene holdes nede.</p>
        `,
      },
      create: {
        id: 'norway-tech-innovation',
        title: 'Norske teknologimiljøer tar ledelsen i det grønne skiftet',
        content: `
          <p><img src="/images/hero.webp" alt="Nordisk innovasjon og næringsliv" /></p>
          <h2>Omstilling starter med tydelige grep</h2>
          <p>Norske virksomheter står midt i et teknologisk og energimessig skifte. Over hele landet jobbes det med å kombinere solid industrierfaring med smartere digitale verktøy og energieffektive løsninger.</p>
          <blockquote>"Nøkkelen ligger i å omsette praktisk bransjekunnskap til løsninger som faktisk fungerer i hverdagen for norske bedrifter."</blockquote>
          <h2>Smartere energibruk og lokal verdiskaping</h2>
          <p>Ved å måle og styre energiforbruket mer presist kan både produksjonsbedrifter og næringsbygg redusere unødvendig svinn betydelig, samtidig som driftskostnadene holdes nede.</p>
        `,
        status: 'published',
        publishedAt: new Date(),
        publisherId: publisher.id,
        customerId: customer.id,
      },
    });
  }

  console.log('Seeding ferdigstilt!');
}

main()
  .catch((e) => {
    console.error('Feil under seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
