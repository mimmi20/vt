import * as CONFIG from './calc.config';
import * as STATES from './states';
import * as TAX from './tax-classes';
import * as LZZ from './lzz';
import * as KRV from './krv-table';

export default class BaseCalculation {
    /** Eingangsparameter */
    private readonly AF_FAKTORVERFAHREN = true;
    private readonly AF_KEIN_FAKTORVERFAHREN = false;

    private readonly KRV_GES_WEST = 0;
    private readonly KRV_GES_OST = 1;
    private readonly KRV_SONST = 2;

    /**
     * gesetzlich krankenversicherte Arbeitnehmer
     */
    private readonly PKV_GES = 0;

    /**
     * ausschließlich privat krankenversicherte Arbeitnehmer ohne Arbeitgeberzuschuss
     */
    private readonly PKV_PRI_OAGZ = 1;

    /**
     * ausschließlich privat krankenversicherte Arbeitnehmer mit Arbeitgeberzuschuss
     */
    private readonly PKV_PRI_MAGZ = 2;

    private readonly KENNVMT_NORMAL = 0;
    private readonly KENNVMT_MT = 1;
    private readonly KENNVMT_VS = 2;

    private readonly KZTAB_GT = 1;
    private readonly KZTAB_SV = 2;

    /**
     * Tabelle für die Prozentsätze des Versorgungsfreibetrags
     */
    private readonly TAB1: (number | null)[] = [
        null,
        0.4,
        0.384,
        0.368,
        0.352,
        0.336,
        0.32,
        0.304,
        0.288,
        0.272,
        0.256,
        0.24,
        0.224,
        0.208,
        0.192,
        0.176,
        0.16,
        0.152,
        0.144,
        0.136,
        0.128,
        0.12,
        0.112,
        0.104,
        0.096,
        0.088,
        0.08,
        0.072,
        0.064,
        0.056,
        0.048,
        0.04,
        0.032,
        0.024,
        0.016,
        0.008,
        0.0,
    ];

    /**
     * Tabelle für die Höchstbeträge des Versorgungsfreibetrags
     * @var number[]
     */
    private readonly TAB2: (number | null)[] = [
        null,
        3000,
        2880,
        2760,
        2640,
        2520,
        2400,
        2280,
        2160,
        2040,
        1920,
        1800,
        1680,
        1560,
        1440,
        1320,
        1200,
        1140,
        1080,
        1020,
        960,
        900,
        840,
        780,
        720,
        660,
        600,
        540,
        480,
        420,
        360,
        300,
        240,
        180,
        120,
        60,
        0,
    ];

    /**
     * Tabelle für die Zuschläge zum Versorgungsfreibetrag
     */
    private readonly TAB3: (number | null)[] = [
        null,
        900,
        864,
        828,
        792,
        756,
        720,
        684,
        648,
        612,
        576,
        540,
        504,
        468,
        432,
        396,
        360,
        342,
        324,
        306,
        288,
        270,
        252,
        234,
        216,
        198,
        180,
        162,
        144,
        126,
        108,
        90,
        72,
        54,
        36,
        18,
        0,
    ];

    /**
     * Tabelle für die Prozentsätze des Altersentlastungsbetrags
     */
    private readonly TAB4: (number | null)[] = [
        null,
        0.4,
        0.384,
        0.368,
        0.352,
        0.336,
        0.32,
        0.304,
        0.288,
        0.272,
        0.256,
        0.24,
        0.224,
        0.208,
        0.192,
        0.176,
        0.16,
        0.152,
        0.144,
        0.136,
        0.128,
        0.12,
        0.112,
        0.104,
        0.096,
        0.088,
        0.08,
        0.072,
        0.064,
        0.056,
        0.048,
        0.04,
        0.032,
        0.024,
        0.016,
        0.008,
        0.0,
    ];

    /**
     * Tabelle für die Höchstbeträge des Altersentlastungsbetrags
     */
    private readonly TAB5: (number | null)[] = [
        null,
        1900,
        1824,
        1748,
        1672,
        1596,
        1520,
        1440,
        1368,
        1292,
        1216,
        1140,
        1064,
        988,
        912,
        836,
        760,
        722,
        684,
        646,
        608,
        532,
        532,
        494,
        456,
        418,
        380,
        342,
        304,
        266,
        228,
        190,
        152,
        114,
        76,
        38,
        0,
    ];

    /**
     * Lohnzahlungszeitraum:
     * 1 = Jahr
     * 2 = Monat
     * 3 = Woche
     * 4 = Tag
     *
     * @var int
     */
    private lzz: number = LZZ.LZZ_MONAT;

    /**
     * Steuerpflichtiger Arbeitslohn für den Lohnzahlungszeitraum vor Berücksichtigung des Versorgungsfreibetrags und
     * des Zuschlags zum Versorgungsfreibetrag, des Altersentlastungsbetrags und des als elektronisches
     * Lohnsteuerabzugsmerkmal festgestellten oder in der Bescheinigung für den Lohnsteuerabzug 2020 für den
     * Lohnzahlungszeitraum eingetragenen Freibetrags bzw. Hinzurechnungsbetrags in Cent
     *
     * @var int
     */
    private re4 = 0;
    private stkl = 0;

    /**
     * Religionsgemeinschaft des Arbeitnehmers lt. elektronischer Lohnsteuerabzugsmerkmale oder der Bescheinigung für
     * den Lohnsteuerabzug 2020 (bei keiner Religionszugehörigkeit = 0)
     *
     * @var int
     */
    private r = 0;

    /**
     * Merker für die Vorsorgepauschale
     *
     * 0 = der Arbeitnehmer ist in der gesetzlichen Rentenversicherung oder einer berufsständischen Versorgungseinrichtung
     * pflichtversichert oder bei Befreiung von der Versicherungspflicht freiwillig versichert; es gilt die
     * allgemeine Beitragsbemessungsgrenze (BBG West)
     *
     * 1 = der Arbeitnehmer ist in der gesetzlichen Rentenversicherung oder einer berufsständischen Versorgungseinrichtung
     * pflichtversichert oder bei Befreiung von der Versicherungspflicht freiwillig versichert; es gilt die
     * Beitragsbemessungsgrenze Ost (BBG Ost)
     *
     * 2 = wenn nicht 0 oder 1
     *
     * @var int|null
     */
    private krv: number | null = null;

    /**
     * 0 = gesetzlich krankenversicherte Arbeitnehmer
     * 1 = ausschließlich privat krankenversicherte Arbeitnehmer ohne Arbeitgeberzuschuss
     * 2 = ausschließlich privat krankenversicherte Arbeitnehmer mit Arbeitgeberzuschuss
     *
     * @var null
     */
    private pkv: number | null = null;

    /**
     * true, wenn bei der sozialen Pflegeversicherung die Besonderheiten in Sachsen zu berücksichtigen sind bzw. zu berücksichtigen wären
     *
     * @var boolean
     */
    private pvs = false;

    /**
     * 1, wenn die Anwendung des Faktorverfahrens gewählt wurde (nur in Steuerklasse IV)
     *
     * @var int
     */
    private af: boolean = this.AF_KEIN_FAKTORVERFAHREN;

    /**
     * Zahl der Freibeträge für Kinder (eine Dezimalstelle, nur bei Steuerklassen I, II, III und IV)
     *
     * @var float
     */
    private zkf = 0.0;

    /**
     * true, wenn der Arbeitnehmer den Zuschlag zur sozialen Pflegeversicherung zu zahlen hat (kinderlos u. über 23J.)
     *
     * @var boolean
     */
    private pvz = false;

    /**
     * Kassenindividueller Zusatzbeitragssatz bei einem gesetzlich krankenversicherten Arbeitnehmer in Prozent
     * (bspw. 1,10 für 1,10 %) mit 2 Dezimalstellen. Es ist der volle Zusatzbeitragssatz anzugeben. Die Aufteilung in
     * Arbeitnehmer- und Arbeitgeberanteil erfolgt im Programmablauf.
     *
     * @var float
     */
    private kvz = 0.0;

    /**
     * Allgemeine Beitragsbemessungsgrenze in der allgemeinen Rentenversicherung in Euro
     *
     * @var int
     */
    private bbgrv = 0;

    /**
     * Beitragssatz des Arbeitnehmers in der allgemeinen gesetzlichen Rentenversicherung (4 Dezimalstellen)
     *
     * @var float
     */
    private rvsatzan = 0.0;

    /**
     * Teilbetragssatz der Vorsorgepauschale für die Rentenversicherung (2 Dezimalstellen)
     *
     * @var float
     */
    private tbsvorv = 0.0;

    /**
     * Beitragsbemessungsgrenze in der gesetzlichen Krankenversicherung und der sozialen Pflegeversicherung in Euro
     *
     * @var int
     */
    private bbgkvpv = 0;

    /**
     * Beitragssatz des Arbeitnehmers zur Krankenversicherung (5 Dezimalstellen)
     *
     * @var float
     */
    private kvsatzan = 0.0;

    /**
     * Beitragssatz des Arbeitgebers zur Krankenversicherung unter Berücksichtigung des durchschnittlichen
     * Zusatzbeitragssatzes für die Ermittlung des Arbeitgeberzuschusses (5 Dezimalstellen)
     *
     * @var float
     */
    private kvsatzag = 0.0;

    /**
     * Beitragssatz des Arbeitnehmers zur Pflegeversicherung (5 Dezimalstellen)
     *
     * @var float
     */
    private pvsatzan = 0.0;

    /**
     * Beitragssatz des Arbeitgebers zur Pflegeversicherung (5 Dezimalstellen)
     *
     * @var float
     */
    private pvsatzag = 0.0;

    /**
     * Erster Grenzwert in Steuerklasse V/VI in Euro
     *
     * @var int
     */
    private w1stkl5 = 0;

    /**
     * Zweiter Grenzwert in Steuerklasse V/VI in Euro
     *
     * @var int
     */
    private w2stkl5 = 0;

    /**
     * Dritter Grenzwert in Steuerklasse V/VI in Euro
     *
     * @var int
     */
    private w3stkl5 = 0;

    /**
     * Grundfreibetrag in Euro
     *
     * @var int
     */
    private gfb = 0;

    /**
     * Freigrenze für den Solidaritätszuschlag in Euro
     *
     * @var int
     */
    private solzfrei = 0;

    /**
     * Bemessungsgrundlage für den Versorgungsfreibetrag in Cent für den sonstigen Bezug
     *
     * @var int
     */
    private vbezbso = 0;

    private kennvmt: number = this.KENNVMT_NORMAL;

    /**
     * Auf einen Jahreslohn hochgerechnetes RE4 in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private zre4j = 0.0;

    /**
     * In RE4 enthaltene Versorgungsbezüge in Cent (ggf. 0) ggf. unter Berücksichtigung einer geänderten
     * Bemessungsgrundlage nach § 19 Absatz 2 Satz 10 und 11 EStG
     *
     * @var int
     */
    private vbez = 0;

    /**
     * Der als elektronisches Lohnsteuerabzugsmerkmal für den Arbeitgeber nach § 39e EStG festgestellte oder in der
     * Bescheinigung für den Lohnsteuerabzug 2020 eingetragene Freibetrag für den Lohnzahlungszeitraum in Cent
     *
     * @var int
     */
    private lzzfreib = 0;

    /**
     * Der als elektronisches Lohnsteuerabzugsmerkmal für den Arbeitgeber nach § 39e EStG festgestellte oder in der
     * Bescheinigung für den Lohnsteuerabzug 2020 eingetragene Hinzurechnungsbetrag für den Lohnzahlungszeitraum in Cent
     *
     * @var int
     */
    private lzzhinzu = 0;

    /**
     * Auf einen Jahreslohn hochgerechnetes VBEZ in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private zvbezj = 0.0;

    /**
     * Auf einen Jahreslohn hochgerechneter LZZFREIB in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private jlfreib = 0.0;

    /**
     * Auf einen Jahreslohn hochgerechneter LZZHINZU in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private jlhinzu = 0.0;

    /**
     * eingetragener Faktor mit drei Nachkommastellen
     *
     * @var int
     */
    private f = 0.0;

    /**
     * Zuschlag zum Versorgungsfreibetrag in Euro
     *
     * @var int
     */
    private fvbz = 0;

    /**
     * Versorgungsfreibetrag in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private fvb = 0.0;

    /**
     * Zuschlag zum Versorgungsfreibetrag in Euro für die Berechnung der Lohnsteuer beim sonstigen Bezug
     *
     * @var int
     */
    private fvbzso = 0;

    /**
     * Versorgungsfreibetrag in Euro, Cent (2 Dezimalstellen) für die Berechnung der Lohnsteuer für den sonstigen Bezug
     *
     * @var float
     */
    private fvbso = 0.0;

    /**
     * Jahr, in dem der Versorgungsbezug erstmalig gewährt wurde; werden mehrere Versorgungsbezüge gezahlt, wird aus
     * Vereinfachungsgründen für die Berechnung das Jahr des ältesten erstmaligen Bezugs herangezogen; auf die
     * Möglichkeit der getrennten Abrechnung verschiedenartiger Bezüge (§ 39e Absatz 5a EStG) wird im Übrigen verwiesen
     *
     * @var int|null
     */
    private vjahr: number | null = null;

    /**
     * Bemessungsgrundlage für den Versorgungsfreibetrag in Cent
     *
     * @var int
     */
    private vbezb = 0;

    /**
     * Versorgungsbezug im Januar 2005 bzw. für den ersten vollen Monat, wenn der Versorgungsbezug erstmalig nach
     * Januar 2005 gewährt wurde, in Cent
     *
     * @var int
     */
    private vbezm = 0;

    /**
     * Zahl der Monate, für die im Kalenderjahr Versorgungsbezüge gezahlt werden [nur erforderlich bei Jahresberechnung (LZZ = 1)]
     *
     * @var int
     */
    private zmvb = 0;

    /**
     * Voraussichtliche Sonderzahlungen von Versorgungsbezügen im Kalenderjahr des Versorgungsbeginns bei
     * Versorgungsempfängern ohne Sterbegeld, Kapitalauszahlungen/Abfindungen in Cent
     *
     * @var int
     */
    private vbezs = 0;

    /**
     * Maßgeblicher maximaler Versorgungsfreibetrag in Euro
     *
     * @var int
     */
    private hfvb = 0;

    /**
     * Maßgeblicher maximaler Zuschlag zum Versorgungsfreibetrag in Euro, Cent (2 Dezimalstellen) für die Berechnung der
     * Lohnsteuer für den sonstigen Bezug
     *
     * @var float
     */
    private hfvbzso = 0.0;

    /**
     * Maßgeblicher maximaler Zuschlag zum Versorgungsfreibetrag in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private hfvbz = 0.0;

    /**
     * 1, wenn das 64. Lebensjahr vor Beginn des Kalenderjahres vollendet wurde, in dem der Lohnzahlungszeitraum endet (§ 24a EStG), sonst = 0
     *
     * @var int
     */
    private alter1 = 0;

    /**
     * Altersentlastungsbetrag in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private alte = 0.0;

    /**
     * Auf die Vollendung des 64. Lebensjahres folgendes Kalenderjahr (erforderlich, wenn ALTER1=1)
     *
     * @var int|null
     */
    private ajahr: number | null = null;

    /**
     * Auf einen Jahreslohn hochgerechnetes RE4 in Euro, Cent (2 Dezimalstellen) nach Abzug der Freibeträge
     * nach § 39b Absatz 2 Satz 3 und 4 EStG
     *
     * @var float
     */
    private zre4 = 0.0;

    /**
     * Auf einen Jahreslohn hochgerechnetes RE4, ggf. nach Abzug der Entschädigungen i.S.d. § 24 Nummer 1 EStG
     * in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private zre4vp = 0.0;

    /**
     * In VKAPA und VMT enthaltene Entschädigungen nach § 24 Nummer 1 EStG in Cent
     *
     * @var int
     */
    private entsch = 0;

    /**
     * Auf einen Jahreslohn hochgerechnetes VBEZ abzüglich FVB in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private zvbez = 0.0;

    /**
     * Arbeitnehmer-Pauschbetrag/Werbungskosten-Pauschbetrag in Euro
     *
     * @var int
     */
    private anp = 0;

    /**
     * Verbrauchter Freibetrag bei Berechnung des laufenden Arbeitslohns, in Cent
     *
     * @var int
     */
    private vfrb = 0;

    /**
     * Zu versteuerndes Einkommen in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private zve = 0.0;

    /**
     * Für die weitergehende Berücksichtigung des Steuerfreibetrags nach dem DBA Türkei verfügbares ZVE über dem
     * Grundfreibetrag bei der Berechnung des laufenden Arbeitslohns, in Cent
     *
     * @var int
     */
    private wvfrb = 0;

    /**
     * Tarifliche Einkommensteuer in Euro
     *
     * @var int
     */
    private st = 0;

    /**
     * Für den Lohnzahlungszeitraum einzubehaltende Lohnsteuer in Cent
     *
     * @var int
     */
    private lstlzz = 0;

    /**
     * Für den Lohnzahlungszeitraum berücksichtigte Beiträge des Arbeitnehmers zur privaten Basis-Krankenversicherung
     * und privaten Pflege-Pflichtversicherung (ggf. auch die Mindestvorsorgepauschale) in Cent beim laufenden Arbeitslohn.
     *
     * Für Zwecke der Lohnsteuerbescheinigung sind die einzelnen Ausgabewerte außerhalb des eigentlichen
     * Lohnsteuerberechnungsprogramms zu addieren; hinzuzurechnen sind auch die Ausgabewerte VKVSONST.
     *
     * @var int
     */
    private vkvlzz = 0;

    /**
     * Zwischenwert 2 bei der Berechnung der Vorsorgepauschale in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private vsp2 = 0.0;

    /**
     * Vorsorgepauschale mit Teilbeträgen für die gesetzliche Krankenund soziale Pflegeversicherung nach fiktiven Beträgen
     * oder ggf. für die private Basiskrankenversicherung und private PflegePflichtversicherung in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private vsp3 = 0.0;

    /**
     * Summe der Freibeträge für Kinder in Euro
     *
     * @var int
     */
    private kfb = 0;

    /**
     * Feste Tabellenfreibeträge (ohne Vorsorgepauschale) in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private ztabfb = 0.0;

    /**
     * Jahressteuer nach § 51a EStG, aus der Solidaritätszuschlag und Bemessungsgrundlage für die Kirchenlohnsteuer
     * ermittelt werden, in Euro
     *
     * @var int
     */
    private jbmg = 0;

    /**
     * Kennzahl für die Einkommensteuer-Tarifarten:
     *
     * 1 = Grundtarif
     * 2 = Splittingverfahren
     *
     * @var int|null
     */
    private kztab: number | null = this.KZTAB_GT;

    /**
     * Vorsorgepauschale mit Teilbeträgen für die Rentenversicherung sowie die gesetzliche Kranken- und soziale
     * Pflegeversicherung nach fiktiven Beträgen oder ggf. für die private Basiskrankenversicherung und private
     * Pflege-Pflichtversicherung in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    private vsp = 0.0;

    /**
     * Dem Arbeitgeber mitgeteilte Beiträge des Arbeitnehmers für eine private Basiskranken- bzw. Pflege-Pflichtversicherung
     * im Sinne des § 10 Absatz 1 Nummer 3 EStG in Cent; der Wert ist unabhängig vom Lohnzahlungszeitraum immer als
     * Monatsbetrag anzugeben
     *
     * @var int
     */
    private pkpv = 0;

    /**
     * Entschädigungen und Vergütung für mehrjährige Tätigkeit ohne Kapitalauszahlungen und ohne Abfindungen bei
     * Versorgungsbezügen in Cent (ggf. 0)
     *
     * @var int
     */
    private vmt = 0;

    /**
     * Entschädigungen/Kapitalauszahlungen/Abfindungen/Nachzahlungen bei Versorgungsbezügen für mehrere Jahre in Cent (ggf. 0)
     *
     * @var int
     */
    private vkapa = 0;

    /**
     * Für den Lohnzahlungszeitraum einzubehaltender Solidaritätszuschlag in Cent
     *
     * @var int
     */
    private solzlzz = 0;

    /**
     * Bemessungsgrundlage für die Kirchenlohnsteuer in Cent
     *
     * @var int
     */
    private bk = 0;

    /**
     * Sonstige Bezüge (ohne Vergütung aus mehrjähriger Tätigkeit) einschließlich Sterbegeld bei Versorgungsbezügen
     * sowie Kapitalauszahlungen/Abfindungen, soweit es sich nicht um Bezüge für mehrere Jahre handelt, in Cent (ggf. 0)
     *
     * @var int
     */
    private sonstb = 0;

    /**
     * Für den Lohnzahlungszeitraum berücksichtigte Beiträge des Arbeitnehmers zur privaten Basis-Krankenversicherung
     * und privaten Pflege-Pflichtversicherung (ggf. auch die Mindestvorsorgepauschale) in Cent bei sonstigen Bezügen.
     * Der Ausgabewert kann auch negativ sein. Für tarifermäßigt zu besteuernde Vergütungen für mehrjährige Tätigkeiten
     * enthält der PAP keinen entsprechenden Ausgabewert.
     *
     * @var int
     */
    private vkvsonst = 0;

    /**
     * Zwischenfelder der Jahreslohnsteuer in Cent
     *
     * @var int
     */
    private lstso = 0;

    /**
     * Lohnsteuer für sonstige Bezüge (ohne Vergütung für mehrjährige Tätigkeit) in Cent
     *
     * @var int
     */
    private sts = 0;

    /**
     * Solidaritätszuschlag für sonstige Bezüge (ohne Vergütung für mehrjährige Tätigkeit) in Cent
     *
     * @var int
     */
    private solzs = 0;

    /**
     * Bemessungsgrundlage der sonstigen Bezüge (ohne Vergütung für mehrjährige Tätigkeit) für die Kirchenlohnsteuer in Cent
     *
     * @var int
     */
    private bks = 0;

    /**
     * Voraussichtlicher Jahresarbeitslohn ohne sonstige Bezüge und ohne Vergütung für mehrjährige Tätigkeit in Cent.
     * Anmerkung: Die Eingabe dieses Feldes (ggf. 0) ist erforderlich bei Eingaben zu sonstigen Bezügen
     * (Felder SONSTB, VMT oder VKAPA).
     *
     * Sind in einem vorangegangenen Abrechnungszeitraum bereits sonstige Bezüge gezahlt worden, so sind sie dem
     * voraussichtlichen Jahresarbeitslohn hinzuzurechnen. Vergütungen für mehrjährige Tätigkeit aus einem
     * vorangegangenen Abrechnungszeitraum werden in voller Höhe hinzugerechnet.
     *
     * @var int
     */
    private jre4 = 0;

    /**
     * In JRE4 enthaltene Versorgungsbezüge in Cent (ggf. 0)
     *
     * @var int
     */
    private jvbez = 0;

    /**
     * In SONSTB enthaltene Versorgungsbezüge einschließlich Sterbegeld in Cent (ggf. 0)
     *
     * @var int
     */
    private vbs = 0;

    /**
     * Sterbegeld bei Versorgungsbezügen sowie Kapitalauszahlungen/Abfindungen, soweit es sich nicht um Bezüge für
     * mehrere Jahre handelt (in SONSTB enthalten), in Cent
     *
     * @var int
     */
    private sterbe = 0;

    /**
     * Für die weitergehende Berücksichtigung des Steuerfreibetrags nach dem DBA Türkei verfügbares ZVE über dem
     * Grundfreibetrag bei der Berechnung der sonstigen Bezüge, in Cent
     *
     * @var int
     */
    private wvfrbm = 0;

    /**
     * Zwischenfelder der Jahreslohnsteuer in Cent
     *
     * @var int
     */
    private lstoso = 0;

    /**
     * Jahresfreibetrag für die Ermittlung der Lohnsteuer für die sonstigen Bezüge nach Maßgabe der elektronischen
     * Lohnsteuerabzugsmerkmale nach § 39e EStG oder der Eintragung auf der Bescheinigung für den Lohnsteuerabzug 2020
     * in Cent (ggf. 0)
     *
     * @var int
     */
    private jfreib = 0;

    /**
     * Jahreshinzurechnungsbetrag für die Ermittlung der Lohnsteuer für die sonstigen Bezüge nach Maßgabe der elektronischen
     * Lohnsteuerabzugsmerkmale nach § 39e EStG oder der Eintragung auf der Bescheinigung für den Lohnsteuerabzug 2020
     * in Cent (ggf. 0)
     *
     * @var int
     */
    private jhinzu = 0;

    /**
     * In JRE4 enthaltene Entschädigungen nach § 24 Nummer 1 EStG in Cent
     *
     * @var int
     */
    private jre4ent = 0;

    /**
     * Verbrauchter Freibetrag bei Berechnung des voraussichtlichen Jahresarbeitslohns, in Cent
     *
     * @var int
     */
    private vfrbs1 = 0;

    /**
     * Für die weitergehende Berücksichtigung des Steuerfreibetrags nach dem DBA Türkei verfügbares ZVE über dem
     * Grundfreibetrag bei der Berechnung des voraussichtlichen Jahresarbeitslohns, in Cent
     *
     * @var int
     */
    private wvfrbo = 0;

    /**
     * In SONSTB enthaltene Entschädigungen nach § 24 Nummer 1 EStG in Cent
     *
     * @var int
     */
    private sonstent = 0;

    /**
     * Verbrauchter Freibetrag bei Berechnung der sonstigen Bezüge, in Cent
     *
     * @var int
     */
    private vfrbs2 = 0;

    /**
     * Lohnsteuer für die Vergütung für mehrjährige Tätigkeit in Cent
     *
     * @var int
     */
    private stv = 0;

    /**
     * Solidaritätszuschlag für sonstige Bezüge (ohne Vergütung für mehrjährige Tätigkeit) in Cent
     *
     * @var int
     */
    private solzv = 0;

    /**
     * Bemessungsgrundlage der Vergütung für mehrjährige Tätigkeit für die Kirchenlohnsteuer in Cent
     *
     * @var int
     */
    private bkv = 0;

    /**
     * Zwischenfelder der Jahreslohnsteuer in Cent
     *
     * @var int
     */
    private lst1 = 0;

    /**
     * Zwischenfelder der Jahreslohnsteuer in Cent
     *
     * @var int
     */
    private lst2 = 0;

    /**
     * Zwischenfelder der Jahreslohnsteuer in Cent
     *
     * @var int
     */
    private lst3 = 0;

    /**
     * Bemessungsgrundlage des Solidaritätszuschlags für die Prüfung der Freigrenze beim Solidaritätszuschlag für die Vergütung für mehrjährige Tätigkeit in Euro
     *
     * @var int
     */
    private solzvbmg = 0;

    calculate(state: string, taxClass: number, re4: number, lzz: number, stTabelle: number, pvz: boolean = true, r: number = 1, zkf: number = 0.0): void {
        this.init(state, taxClass, re4, lzz, stTabelle, pvz, r, zkf);
        this.LST2021();
    }

    init(state: string, taxClass: number, re4: number, lzz: number, stTabelle: number, pvz: boolean = true, r: number = 1, zkf: number = 0.0): void {
        this.lzz = lzz;
        this.re4 = Math.floor(re4 * 100);
        this.stkl = taxClass;
        this.r = r;

        if (KRV.KRV_TABELLE_ALLGEMEIN === stTabelle) {
            /**
             * Allgemeine Lohnsteuer ist die Lohnsteuer, die für einen Arbeitnehmer zu erheben ist, der in
             * allen Sozialversicherungszweigen versichert ist.
             */
            if (STATES.isStateWest(state)) {
                this.krv = this.KRV_GES_WEST;
            } else if (STATES.isStateEast(state)) {
                this.krv = this.KRV_GES_OST;
            } else {
                throw new Error('unsupported state ' + state + ' given');
            }
        } else {
            /**
             * Besondere Lohnsteuer ist die Lohnsteuer, die für einen Arbeitnehmer zu erheben ist, der in
             * keinem Sozialversicherungszweig versichert und privat kranken- und pflegeversichert ist
             * sowie dem Arbeitgeber keine Basiskranken- und Pflege-Pflichtversicherungsbeiträge
             * mitgeteilt hat.
             */
            this.krv = this.KRV_SONST;
            this.pkv = this.PKV_PRI_OAGZ;
        }

        if (STATES.BUNDESLAND_SN === state) {
            this.pvs = true;
        }

        if (TAX.STKL_VI !== this.stkl) {
            this.af = this.AF_KEIN_FAKTORVERFAHREN;
        }

        if (TAX.STKL_V === this.stkl || TAX.STKL_VI === this.stkl) {
            this.zkf = 0.0;
        } else {
            this.zkf = zkf;
        }

        if (TAX.STKL_II === this.stkl || this.zkf !== 0.0) {
            this.pvz = false;
        } else {
            this.pvz = pvz;
        }

        this.kvz = Math.round(CONFIG.KVZ * 100) / 100;
    }

    LST2021(): void {
        this.MPARA();
        this.MRE4JL();

        this.vbezbso = 0;
        this.kennvmt = this.KENNVMT_NORMAL;

        this.MRE4();
        this.MRE4ABZ();
        this.MBERECH();
        this.MSONST();
        this.MVMT();
    }

    /**
     * Zuweisung von Werten für bestimmte Sozialversicherungsparameter
     */
    MPARA(): void {
        if (this.krv === this.KRV_GES_WEST) {
            this.bbgrv = CONFIG.BBGRV_WEST;
        } else if (this.krv === this.KRV_GES_OST) {
            this.bbgrv = CONFIG.BBGRV_OST;
        }

        if (this.krv === this.KRV_GES_WEST || this.krv === this.KRV_GES_OST) {
            this.rvsatzan = CONFIG.RVSATZAN;
            this.tbsvorv = CONFIG.TBSVORV;
        }

        this.bbgkvpv = CONFIG.BBGKVPV;
        this.kvsatzan = this.kvz / 2 / 100 + 0.07;
        this.kvsatzag = 0.0065 + 0.07;

        if (this.pvs) {
            this.pvsatzan = 0.02025;
            this.pvsatzag = 0.01025;
        } else {
            this.pvsatzan = 0.01525;
            this.pvsatzag = 0.01525;
        }

        if (this.pvz) {
            this.pvsatzan += 0.0025;
        }

        this.w1stkl5 = CONFIG.W1STKL5;
        this.w2stkl5 = CONFIG.W2STKL5;
        this.w3stkl5 = CONFIG.W3STKL5;
        this.gfb = CONFIG.GFB;
        this.solzfrei = CONFIG.SOLZFREI;
    }

    /**
     * Ermittlung des Jahresarbeitslohns nach § 39b Absatz 2 Satz 2 EStG
     */
    MRE4JL(): void {
        switch (this.lzz) {
            case LZZ.LZZ_JAHR:
                this.zre4j = this.re4 / 100;
                this.zvbezj = this.vbez / 100;
                this.jlfreib = this.lzzfreib / 100;
                this.jlhinzu = this.lzzhinzu / 100;
                break;
            case LZZ.LZZ_MONAT:
                this.zre4j = (this.re4 * 12) / 100;
                this.zvbezj = (this.vbez * 12) / 100;
                this.jlfreib = (this.lzzfreib * 12) / 100;
                this.jlhinzu = (this.lzzhinzu * 12) / 100;
                break;
            case LZZ.LZZ_WOCHE:
                this.zre4j = (this.re4 * 360) / 7 / 100;
                this.zvbezj = (this.vbez * 360) / 7 / 100;
                this.jlfreib = (this.lzzfreib * 360) / 7 / 100;
                this.jlhinzu = (this.lzzhinzu * 360) / 7 / 100;
                break;
            case LZZ.LZZ_TAG:
                this.zre4j = (this.re4 * 360) / 100;
                this.zvbezj = (this.vbez * 360) / 100;
                this.jlfreib = (this.lzzfreib * 360) / 100;
                this.jlhinzu = (this.lzzhinzu * 360) / 100;
                break;
            default:
                throw new Error('unsupported parameter ' + this.lzz.toString() + ' given as LZZ parameter');
        }

        if (this.AF_KEIN_FAKTORVERFAHREN === this.af) {
            this.f = 1.0;
        }
    }

    MRE4(): void {
        if (0 === Math.floor(this.zvbezj)) {
            this.fvbz = 0;
            this.fvb = 0;
            this.fvbzso = 0;
            this.fvbso = 0.0;
            this.alte = this.MRE4ALTE();

            return;
        }

        let j = 36;

        if (this.vjahr !== null && this.vjahr < 2006) {
            j = 1;
        } else if (this.vjahr !== null && this.vjahr < 2040) {
            j = this.vjahr - 2004;
        }

        const tab1 = this.TAB1[j],
            tab2 = this.TAB2[j],
            tab3 = this.TAB3[j];

        if (null === tab1 || null === tab2 || null === tab3) {
            throw new Error('invalid year selected');
        }

        switch (this.lzz) {
            case LZZ.LZZ_JAHR:
                this.vbezb = this.vbezm * this.zmvb + this.vbezs;
                this.hfvb = (tab2 / 12) * this.zmvb;
                this.fvbz = Math.floor(Math.ceil((tab3 / 12) * this.zmvb));
                break;
            default:
                this.vbezb = this.vbezm * 12 + this.vbezs;
                this.hfvb = tab2;
                this.fvbz = Math.floor(Math.ceil(tab3));
        }

        this.fvb = Math.ceil(this.vbezb * tab1) / 100;

        if (this.fvb > this.hfvb) {
            this.fvb = this.hfvb;
        }

        if (this.fvb > this.zvbezj) {
            this.fvb = this.zvbezj;
        }

        this.fvbso = Math.ceil(this.fvb + this.vbezbso * tab1) / 100;

        if (this.fvbso > tab2) {
            this.fvbso = tab2;
        }

        this.hfvbzso = (this.vbezb + this.vbezbso) / 100 - this.fvbso;
        this.fvbzso = Math.floor(Math.ceil(this.fvbz + this.vbezbso / 100));

        if (this.fvbzso > this.hfvbzso) {
            this.fvbzso = Math.floor(Math.ceil(this.hfvbzso));
        }

        if (this.fvbzso > tab3) {
            this.fvbzso = Math.floor(tab3);
        }

        this.hfvbz = this.vbezb / 100 - this.fvb;

        if (this.fvbz > this.hfvbz) {
            this.fvbz = Math.floor(Math.ceil(this.hfvbz));
        }

        this.alte = this.MRE4ALTE();
    }

    MRE4ALTE(): number {
        if (0 === this.alter1) {
            return 0.0;
        }

        let k = 36;

        if (this.ajahr !== null && this.ajahr < 2006) {
            k = 1;
        } else if (this.ajahr !== null && this.ajahr < 2040) {
            k = this.ajahr - 2004;
        }

        const bmg = this.zre4j - this.zvbezj,
            tab4 = this.TAB4[k],
            tab5 = this.TAB5[k];

        if (null === tab4 || null === tab5) {
            throw new Error('invalid year selected');
        }

        let alte = Math.ceil(bmg * tab4);

        if (alte > tab5) {
            alte = tab5;
        }

        return alte;
    }

    MRE4ABZ(): void {
        this.zre4 = this.zre4j - this.fvb - this.alte - this.jlfreib + this.jlhinzu;

        if (0 > this.zre4) {
            this.zre4 = 0.0;
        }

        this.zre4vp = this.zre4j;

        if (this.kennvmt === this.KENNVMT_VS) {
            this.zre4vp -= this.entsch / 100;
        }

        this.zvbez = this.zvbezj - this.fvb;

        if (0 > this.zvbez) {
            this.zvbez = 0.0;
        }
    }

    MBERECH(): void {
        this.MZTABFB();

        this.vfrb = Math.floor(this.anp + this.fvb + this.fvbz) * 100;

        this.MLSTJAHR();

        this.wvfrb = Math.floor(this.zve - this.gfb) * 100;

        if (this.wvfrb < 0) {
            this.wvfrb = 0;
        }

        const lstjahr = this.st * this.f;

        // Ermittlung des Anteils der Jahreslohnsteuer für den Lohnzahlungszeitraum
        this.lstlzz = Math.floor(this.UPLSTLZZ(lstjahr));

        // Ermittlung des Anteils der berücksichtigten Vorsorgeaufwendungen für den Lohnzahlungszeitraum
        this.vkvlzz = this.UPVKVLZZ(this.vsp2, this.vsp3);

        if (this.zkf > 0.0) {
            this.ztabfb += this.kfb;

            this.MRE4ABZ();
            this.MLSTJAHR();

            this.jbmg = this.st * this.f;
        } else {
            this.jbmg = lstjahr;
        }

        this.MSOLZ();
    }

    /**
     * Ermittlung der festen Tabellenfreibeträge (ohne Vorsorgepauschale)
     */
    private MZTABFB(): void {
        this.anp = 0;

        // Mögliche Begrenzung des Zuschlags zum Versorgungsfreibetrag, und Festlegung und Begrenzung Werbungskosten-Pauschbetrag für Versorgungsbezüge
        if (0.0 <= this.zvbez && this.zvbez < this.fvbz) {
            this.fvbz = Math.floor(this.zvbez);
        }

        if (this.stkl === TAX.STKL_VI) {
            this.fvbz = 0;
            this.fvbzso = 0;
        } else {
            if (this.zvbez > 0.0) {
                if (this.zvbez - this.fvbz < 102) {
                    this.anp = Math.floor(Math.ceil(this.zvbez - this.fvbz));
                } else {
                    this.anp = 102;
                }
            }

            // Festlegung Arbeitnehmer- Pauschbetrag für aktiven Lohn mit möglicher Begrenzung
            if (this.zre4 > this.zvbez) {
                if (this.zre4 - this.zvbez < 1000) {
                    this.anp = Math.floor(Math.ceil(this.anp + this.zre4 - this.zvbez));
                } else {
                    this.anp += 1000;
                }
            }
        }

        let efa = 0;
        let sap = 0;
        this.kfb = 0;
        this.kztab = this.KZTAB_GT;

        if (this.stkl === TAX.STKL_I) {
            sap = 36;
            this.kfb = Math.floor(this.zkf * 8388);
        } else if (this.stkl === TAX.STKL_II) {
            efa = 1908;
            sap = 36;
            this.kfb = Math.floor(this.zkf * 8388);
        } else if (this.stkl === TAX.STKL_III) {
            this.kztab = this.KZTAB_SV;
            sap = 36;
            this.kfb = Math.floor(this.zkf * 8388);
        } else if (this.stkl === TAX.STKL_IV) {
            sap = 36;
            this.kfb = Math.floor(this.zkf * 4194);
        } else if (this.stkl === TAX.STKL_V) {
            sap = 36;
        } else if (this.stkl !== TAX.STKL_VI) {
            throw new Error('invalid tax class ' + this.stkl.toString());
        }

        // Berechnung der Tabellenfreibeträge ohne Freibeträge für Kinder für die Lohnsteuerberechnung
        this.ztabfb = efa + this.anp + sap + this.fvbz;
    }

    /**
     * Ermittlung Jahreslohnsteuer
     */
    private MLSTJAHR(): void {
        this.UPEVP();

        if (this.kennvmt !== this.KENNVMT_MT) {
            this.zve = this.zre4 - this.ztabfb - this.vsp;

            this.st = this.UPMLST();

            return;
        }

        this.zve = this.zre4 - this.ztabfb - this.vsp - this.vmt / 100 - this.vkapa / 100;

        if (this.zve < 0) {
            // Sonderfall des negativen verbleibenden zvE nach § 34 Absatz 1 Satz 3 EStG
            this.zve = (this.zve + this.vmt / 100 + this.vkapa / 100) / 5;

            this.st = this.UPMLST();

            this.st *= 5;

            return;
        }

        // Steuerberechnung ohne Einkünfte nach § 34 EStG
        const stovmt = this.UPMLST();

        // Steuerberechnung mit Einkünften nach § 34 EStG
        this.zve += (this.vmt + this.vkapa) / 500;

        this.st = this.UPMLST();

        this.st = (this.st - stovmt) * 5 + stovmt;
    }

    /**
     * Vorsorgepauschale (§ 39b Absatz 2 Satz 5 Nummer 3 und Absatz 4 EStG)
     */
    private UPEVP(): void {
        let vsp1 = 0.0;

        if (this.KRV_SONST !== this.krv) {
            if (this.zre4vp > this.bbgrv) {
                this.zre4vp = this.bbgrv;
            }

            vsp1 = this.tbsvorv * this.zre4vp * this.rvsatzan;
        }

        this.vsp2 = 0.12 * this.zre4vp;

        let vhb = 1900.0;

        if (this.stkl === TAX.STKL_III) {
            vhb = 3000.0;
        }

        if (this.vsp2 > vhb) {
            this.vsp2 = vhb;
        }

        const vspn = Math.ceil(vsp1 + this.vsp2);

        this.MVSP(vsp1);

        if (vspn > this.vsp) {
            this.vsp = vspn;
        }
    }

    /**
     * Vorsorgepauschale (§ 39b Absatz 2 Satz 5 Nummer 3 EStG) Vergleichsberechnung zur Mindestvorsorgepauschale
     */
    private MVSP(vsp1: number): void {
        if (this.zre4vp > this.bbgkvpv) {
            this.zre4vp = this.bbgkvpv;
        }

        if (this.pkv !== null && this.pkv > this.PKV_GES) {
            if (TAX.STKL_VI === this.stkl) {
                this.vsp3 = 0.0;
            } else {
                this.vsp3 = (this.pkpv * 12) / 100;

                if (this.pkv === this.PKV_PRI_MAGZ) {
                    this.vsp3 -= this.zre4vp * (this.kvsatzag + this.pvsatzag);
                }
            }
        } else {
            this.vsp3 = this.zre4vp * (this.kvsatzan + this.pvsatzan);
        }

        this.vsp = Math.ceil(this.vsp3 + vsp1);
    }

    private UPMLST(): number {
        let x = 0.0;

        if (this.zve < 1.0) {
            this.zve = 0.0;
        } else {
            if (null === this.kztab) {
                throw new Error('kztab not set');
            }

            x = Math.floor(this.zve / this.kztab);
        }

        if (this.stkl < TAX.STKL_V) {
            return Math.floor(this.UPTAB21(x));
        }

        return this.MST56(x);
    }

    /**
     * Tarifliche Einkommensteuer (§ 32a EStG)
     */
    private UPTAB21(x: number): number {
        if (x < this.gfb + 1) {
            return 0.0;
        }

        let st;

        if (x < 14754) {
            const y = (x - this.gfb) / 10000;
            let rw = y * 995.21;
            rw += 1400;
            st = Math.floor(rw * y);
        } else if (x < 57919) {
            const y = (x - 14753) / 10000;
            let rw = y * 208.85;
            rw += 2397;
            rw *= y;
            st = Math.floor(rw + 950.96);
        } else if (x < 274613) {
            st = Math.floor(x * 0.42 - 9136.63);
        } else {
            st = Math.floor(x * 0.45 - 17374.99);
        }

        if (null === this.kztab) {
            throw new Error('kztab not set');
        }

        return st * this.kztab;
    }

    /**
     * Lohnsteuer für die Steuerklassen V und VI (§ 39b Absatz 2 Satz 7 EStG)
     */
    private MST56(x: number): number {
        const zzx = Math.floor(x);
        let st;

        if (zzx > this.w2stkl5) {
            st = this.UP56(this.w2stkl5);

            if (zzx > this.w3stkl5) {
                st = Math.floor(st + (this.w3stkl5 - this.w2stkl5) * 0.42);

                return Math.floor(st + (zzx - this.w3stkl5) * 0.45);
            }

            return Math.floor(st + (zzx - this.w2stkl5) * 0.42);
        }

        st = this.UP56(zzx);

        if (zzx > this.w1stkl5) {
            const vergl = st;
            st = this.UP56(this.w1stkl5);
            const hoch = Math.floor(st + (zzx - this.w1stkl5) * 0.42);

            return Math.min(hoch, vergl);
        }

        return st;
    }

    private UP56(zx: number): number {
        const st1 = this.UPTAB21(zx * 1.25);
        const st2 = this.UPTAB21(zx * 0.75);

        const diff = (st1 - st2) * 2;
        const mist = Math.floor(zx * 0.14);

        return Math.floor(Math.max(mist, diff));
    }

    /**
     * Solidaritätszuschlag
     */
    private MSOLZ(): void {
        if (null === this.kztab) {
            throw new Error('kztab not set');
        }

        this.solzfrei *= this.kztab;

        if (this.jbmg > this.solzfrei) {
            let solzj = Math.floor(this.jbmg * 5.5) / 100;
            const solzmin = ((this.jbmg - this.solzfrei) * 11.9) / 100;

            if (solzmin < solzj) {
                solzj = solzmin;
            }

            this.solzlzz = Math.floor(this.UPANTEIL(solzj * 100));
        } else {
            this.solzlzz = 0;
        }

        // Aufteilung des Betrages nach § 51a EStG auf den LZZ für die Kirchensteuer
        if (this.r > 0) {
            this.bk = Math.floor(this.UPANTEIL(this.jbmg * 100));
        } else {
            this.bk = 0;
        }
    }

    /**
     * Anteil von Jahresbeträgen für einen LZZ (§ 39b Absatz 2 Satz 9 EStG)
     */
    private UPANTEIL(jw: number): number {
        if (this.lzz === LZZ.LZZ_JAHR) {
            return jw;
        }

        if (this.lzz == LZZ.LZZ_MONAT) {
            return Math.floor(jw / 12);
        }

        if (this.lzz == LZZ.LZZ_WOCHE) {
            return Math.floor((jw * 7) / 360);
        }

        return Math.floor(jw / 360);
    }

    private UPLSTLZZ(lstjahr: number): number {
        return this.UPANTEIL(lstjahr * 100);
    }

    private UPVKVLZZ(vsp2: number, vsp3: number): number {
        // Ermittlung des Jahreswertes der berücksichtigten privaten Kranken- und Pflegeversicherungsbeiträge
        const vkv = this.UPVKV(vsp2, vsp3);

        // Ermittlung des Anteils der berücksichtigten privaten Kranken- und Pflegeversiche- rungsbeiträge für den Lohnzahlungszeitraum
        return this.UPANTEIL(vkv);
    }

    private UPVKV(vsp2: number, vsp3: number): number {
        if (this.pkv === this.PKV_GES) {
            return 0.0;
        }

        return Math.max(vsp2, vsp3) * 100;
    }

    private MSONST(): void {
        this.lzz = 1;

        if (this.zmvb === 0) {
            this.zmvb = 12;
        }

        if (this.sonstb === 0) {
            this.vkvsonst = 0;
            this.lstso = 0;
            this.sts = 0;
            this.solzs = 0;
            this.bks = 0;

            return;
        }

        this.MOSONST();
        let vkv = this.UPVKV(this.vsp2, this.vsp3);

        this.vkvsonst = vkv;
        this.zre4j = (this.jre4 + this.sonstb) / 100;
        this.zvbezj = (this.jvbez + this.vbs) / 100;
        this.vbezbso = this.sterbe;

        this.MRE4SONST();
        this.MLSTJAHR();

        this.wvfrbm = (this.zve - this.gfb) * 100;

        if (this.wvfrbm < 0) {
            this.wvfrbm = 0;
        }

        vkv = this.UPVKV(this.vsp2, this.vsp3);

        this.vkvsonst = vkv - this.vkvsonst;
        this.lstso = this.st * 100;
        this.sts = Math.floor((this.lstso - this.lstoso) * this.f);

        if (this.sts < 0) {
            // Negative Lohnsteuer auf sonstigen Bezug wird nicht zugelassen
            this.sts = 0;
        }

        this.MSOLZSTS();

        if (this.r > 0) {
            this.bks = this.sts;

            return;
        }

        this.bks = 0;
    }

    private MOSONST(): void {
        this.zre4j = this.jre4 / 100;
        this.zvbezj = this.jvbez / 100;
        this.jlfreib = this.jfreib / 100;
        this.jlhinzu = this.jhinzu / 100;

        this.MRE4();
        this.MRE4ABZ();

        this.zre4vp = this.zre4vp - this.jre4ent / 100;

        this.MZTABFB();

        this.vfrbs1 = (this.anp + this.fvb + this.fvbz) * 100;

        this.MLSTJAHR();

        this.wvfrbo = (this.zve - this.gfb) * 100;

        if (this.wvfrbo < 0) {
            this.wvfrbo = 0;
        }

        this.lstoso = this.st * 100;
    }

    private MRE4SONST(): void {
        this.MRE4();

        this.fvb = this.fvbso;

        this.MRE4ABZ();

        this.zre4vp = this.zre4vp - this.jre4ent / 100 - this.sonstent / 100;
        this.fvbz = this.fvbzso;

        this.MZTABFB();

        this.vfrbs2 = (this.anp + this.fvb + this.fvbz) * 100 - this.vfrbs1;
    }

    private MSOLZSTS() {
        let solzszve;

        if (this.zkf > 0) {
            solzszve = this.zve - this.kfb;
        } else {
            solzszve = this.zve;
        }

        let x;

        if (solzszve < 1) {
            x = 0.0;
        } else {
            if (null === this.kztab) {
                throw new Error('kztab not set');
            }

            x = Math.floor(solzszve / this.kztab);
        }

        if (this.stkl < 5) {
            this.st = this.UPTAB21(x);
        } else {
            this.st = this.MST56(x);
        }

        const solzsbmg = this.st * this.f;

        if (solzsbmg > this.solzfrei) {
            this.solzs = Math.floor(this.sts * 5.5) / 100;
        } else {
            this.solzs = 0;
        }
    }

    private MVMT(): void {
        if (this.vkapa < 0) {
            this.vkapa = 0;
        }

        this.stv = 0;
        this.solzv = 0;
        this.bkv = 0;

        if (this.vmt + this.vkapa > 0) {
            if (this.lstso === 0) {
                this.MOSONST();
            }

            this.lst1 = this.lstso;
            this.vbezbso = this.sterbe + this.vkapa;
            this.zre4j = (this.jre4 + this.sonstb + this.vmt + this.vkapa) / 100;
            this.zvbezj = (this.jvbez + this.vbs + this.vkapa) / 100;

            this.kennvmt = this.KENNVMT_VS;

            this.MRE4SONST();
            this.MLSTJAHR();

            this.lst3 = this.st * 100;

            this.kennvmt = this.KENNVMT_VS;

            this.MRE4ABZ();

            this.zre4vp -= this.jre4ent / 100 - this.sonstent / 100;
            this.kennvmt = this.KENNVMT_MT;

            this.MLSTJAHR();

            this.lst2 = this.st * 100;
            this.stv = this.lst2 - this.lst1;
            this.lst3 -= this.lst1;

            if (this.lst3 < this.stv) {
                this.stv = this.lst3;
            }

            if (this.stv < 0) {
                this.stv = 0;
                this.solzv = 0;
            } else {
                this.stv = Math.floor(this.stv * this.f);
                this.solzv = Math.floor(this.stv * 5.5) / 100;
            }

            this.solzvbmg = this.stv / 100 + this.jbmg;

            if (this.solzvbmg > this.solzfrei) {
                this.solzv = Math.floor(this.stv * 5.5) / 100;
            } else {
                this.solzv = 0;
            }

            if (this.r > 0) {
                this.bkv = this.stv;

                return;
            }

            this.bkv = 0;

            return;
        }
    }

    getLstlzz(): number {
        return this.lstlzz;
    }

    getSolzlzz(): number {
        return this.solzlzz;
    }

    getBk(): number {
        return this.bk;
    }

    getBbgrv(): number {
        return this.bbgrv;
    }

    getKvsatzag(): number {
        return this.kvsatzag;
    }

    getPvsatzan(): number {
        return this.pvsatzan;
    }

    getBbgkvpv(): number {
        return this.bbgkvpv;
    }

    getKvz(): number {
        return this.kvz;
    }
}
