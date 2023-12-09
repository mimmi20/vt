import * as CONFIG from './calc.config';
import * as TAX from './tax-classes';
import * as LZZ from './lzz';

export default class BaseCalculation {
    /** Eingangsparameter */
    //private readonly AF_FAKTORVERFAHREN = true;
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
    //private readonly PKV_PRI_OAGZ = 1;

    /**
     * ausschließlich privat krankenversicherte Arbeitnehmer mit Arbeitgeberzuschuss
     */
    private readonly PKV_PRI_MAGZ = 2;

    private readonly KENNVMT_NORMAL = 0;
    private readonly KENNVMT_MT = 1;
    private readonly KENNVMT_VS = 2;

    private readonly KZTAB_GRUNDTARIF = 1;
    private readonly KZTAB_SPLITTINGVERFAHREN = 2;

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
     * Nicht zu besteuernde Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 1 Satz 4 EStG) in Cent
     *
     * @var int
     */
    private mbv = 0;

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
     * true, wenn das 64. Lebensjahr vor Beginn des Kalenderjahres vollendet wurde, in dem der Lohnzahlungszeitraum endet (§ 24a EStG), sonst false
     *
     * @var boolean
     */
    private alter1 = false;

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
    //private st: number = 0;

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
    private kztab: number | null = this.KZTAB_GRUNDTARIF;

    /**
     * Vorsorgepauschale mit Teilbeträgen für die Rentenversicherung sowie die gesetzliche Kranken- und soziale
     * Pflegeversicherung nach fiktiven Beträgen oder ggf. für die private Basiskrankenversicherung und private
     * Pflege-Pflichtversicherung in Euro, Cent (2 Dezimalstellen)
     *
     * @var float
     */
    //private vsp: number = 0.0;

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
    //private lstoso: number = 0;

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
     * Bemessungsgrundlage des Solidaritätszuschlags für die Prüfung der Freigrenze beim Solidaritätszuschlag für die Vergütung für mehrjährige Tätigkeit in Euro
     *
     * @var int
     */
    private solzvbmg = 0;

    /**
     * @param stkl Steuerklasse
     * @param re4 zu versteuerndes Einkommen in Cent
     * @param lzz Lohnzahlungszeitraum
     * @param krv Merker für die Vorsorgepauschale
     * @param pvz true, wenn der Arbeitnehmer den Zuschlag zur sozialen Pflegeversicherung zu zahlen hat
     * @param r Religionsgemeinschaft des Arbeitnehmers
     * @param kvz Kassenindividueller Zusatzbeitragssatz bei einem gesetzlich krankenversicherten Arbeitnehmer in Prozent
     * @param zkf Zahl der Freibeträge für Kinder
     * @param pkv privat krankenversichert
     * @param pvs true, wenn bei der sozialen Pflegeversicherung die Besonderheiten in Sachsen zu berücksichtigen sind bzw. zu berücksichtigen wären
     * @param af true, wenn die Anwendung des Faktorverfahrens gewählt wurde (nur in Steuerklasse IV)
     * @param ajahr Auf die Vollendung des 64. Lebensjahres folgendes Kalenderjahr (erforderlich, wenn ALTER1=1)
     * @param alter1 true, wenn das 64. Lebensjahr vor Beginn des Kalenderjahres vollendet wurde, in dem der Lohnzahlungszeitraum endet (§ 24a EStG), sonst false
     * @param entsch In vkapa und vmt enthaltene Entschädigungen nach § 24 Nummer 1 EStG sowie tarifermäßigt zu besteuernde Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 4 EStG) in Cent
     * @param f eingetragener Faktor mit drei Nachkommastellen
     * @param jfreib Jahresfreibetrag für die Ermittlung der Lohnsteuer in Cent
     * @param jhinzu Jahreshinzurechnungsbetrag für die Ermittlung der Lohnsteuer in Cent
     * @param jre4 Voraussichtlicher Jahresarbeitslohn ohne sonstige Bezüge in Cent. Anmerkung: Die Eingabe dieses Feldes (ggf. 0) ist erforderlich bei Eingaben zu sonstigen Bezügen (Felder $sonstb, $vmt oder $vkapa).
     * @param jre4ent In jre4 enthaltene Entschädigungen in Cent
     * @param jvbez In jre4 enthaltene Versorgungsbezüge in Cent
     * @param lzzfreib der eingetragene Freibetrag für den Lohnzahlungszeitraum in Cent
     * @param lzzhinzu der eingetragene Hinzurechnungsbetrag für den Lohnzahlungszeitraum in Cent
     * @param mbv Nicht zu besteuernde Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 1 Satz 4 EStG) in Cent
     * @param pkpv Dem Arbeitgeber mitgeteilte Beiträge des Arbeitnehmers für eine private Basiskranken- bzw. Pflege-Pflichtversicherung
     * @param sonstb Sonstige Bezüge (ohne Vergütung aus mehrjähriger Tätigkeit) in Cent
     * @param sonstent In sonstb enthaltene Entschädigungen
     * @param sterbe Sterbegeld bei Versorgungsbezügen sowie Kapitalauszahlungen/Abfindungen in Cent
     * @param vbez In re4 enthaltene Versorgungsbezüge in Cent
     * @param vbezm Versorgungsbezug im Januar 2005 bzw. für den ersten vollen Monat, wenn der Versorgungsbezug erstmalig nach Januar 2005 gewährt wurde, in Cent
     * @param vbezs Voraussichtliche Sonderzahlungen von Versorgungsbezügen in Cent
     * @param vbs In sonstb enthaltene Versorgungsbezüge einschließlich Sterbegeld in Cent (ggf. 0)
     * @param vjahr Jahr, in dem der Versorgungsbezug erstmalig gewährt wurde
     * @param vkapa Entschädigungen/Kapitalauszahlungen/Abfindungen/Nachzahlungen bei Versorgungsbezügen für mehrere Jahre in Cent (ggf. 0)
     * @param vmt Entschädigungen und Vergütung für mehrjährige Tätigkeit sowie tarifermäßigt zu besteuernde Vorteile bei Vermögensbeteiligungen in Cent
     * @param zmvb Zahl der Monate, für die im Kalenderjahr Versorgungsbezüge gezahlt werden [nur erforderlich bei Jahresberechnung (LZZ = 1)]
     */
    public calculate(
        stkl: number,
        re4: number,
        lzz: number,
        krv: number,
        pvz: boolean,
        r: number = 1,
        kvz: number,
        zkf: number = 0.0,
        pkv: number = this.PKV_GES,
        pvs: boolean = false,
        af: boolean = this.AF_KEIN_FAKTORVERFAHREN,
        ajahr: number = 0,
        alter1: boolean = false,
        entsch: number = 0,
        f: number = 0.0,
        jfreib: number = 0,
        jhinzu: number = 0,
        jre4: number = 0,
        jre4ent: number = 0,
        jvbez: number = 0,
        lzzfreib: number = 0,
        lzzhinzu: number = 0,
        mbv: number = 0,
        pkpv: number = 0,
        sonstb: number = 0,
        sonstent: number = 0,
        sterbe: number = 0,
        vbez: number = 0,
        vbezm: number = 0,
        vbezs: number = 0,
        vbs: number = 0,
        vjahr: number = 0,
        vkapa: number = 0,
        vmt: number = 0,
        zmvb: number = 0,
    ): void {
        this.stkl = stkl;
        this.re4 = re4;
        this.lzz = lzz;
        this.krv = krv;
        this.pvz = pvz;
        this.r = r;
        this.kvz = kvz;
        this.zkf = zkf;
        this.pkv = pkv;
        this.pvs = pvs;
        this.af = af;
        this.ajahr = ajahr;
        this.alter1 = alter1;
        this.entsch = entsch;
        this.f = f;
        this.jfreib = jfreib;
        this.jhinzu = jhinzu;
        this.jre4 = jre4;
        this.jre4ent = jre4ent;
        this.jvbez = jvbez;
        this.lzzfreib = lzzfreib;
        this.lzzhinzu = lzzhinzu;
        this.mbv = mbv;
        this.pkpv = pkpv;
        this.sonstb = sonstb;
        this.sonstent = sonstent;
        this.sterbe = sterbe;
        this.vbez = vbez;
        this.vbezm = vbezm;
        this.vbezs = vbezs;
        this.vbs = vbs;
        this.vjahr = vjahr;
        this.vkapa = vkapa;
        this.vmt = vmt;
        this.zmvb = zmvb;

        this.LST2023();
    }

    public getLstlzz(): number {
        return this.lstlzz;
    }

    public getSolzlzz(): number {
        return this.solzlzz;
    }

    public getBk(): number {
        return this.bk;
    }

    public getBks(): number {
        return this.bks;
    }

    public getBkv(): number {
        return this.bkv;
    }

    public getBbgrv(): number {
        return this.bbgrv;
    }

    public getKvsatzag(): number {
        return this.kvsatzag;
    }

    public getPvsatzan(): number {
        return this.pvsatzan;
    }

    public getBbgkvpv(): number {
        return this.bbgkvpv;
    }

    public getKvz(): number {
        return this.kvz;
    }

    public getSolzs(): number {
        return this.solzs;
    }

    public getSolzv(): number {
        return this.solzv;
    }

    public getSts(): number {
        return this.sts;
    }

    public getStv(): number {
        return this.stv;
    }

    public getVkvlzz(): number {
        return this.vkvlzz;
    }

    public getVkvsonst(): number {
        return this.vkvsonst;
    }

    public getVfrb(): number {
        return this.vfrb;
    }

    public getVfrbs1(): number {
        return this.vfrbs1;
    }

    public getVfrbs2(): number {
        return this.vfrbs2;
    }

    public getWvfrb(): number {
        return this.wvfrb;
    }

    public getWvfrbo(): number {
        return this.wvfrbo;
    }

    public getWvfrbm(): number {
        return this.wvfrbm;
    }

    private LST2023(): void {
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
    private MPARA(): void {
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
        this.kvsatzag = 0.008 + 0.07;

        if (this.pvs) {
            this.pvsatzan = 0.02025;
            this.pvsatzag = 0.01025;
        } else {
            this.pvsatzan = 0.01525;
            this.pvsatzag = 0.01525;
        }

        if (this.pvz) {
            this.pvsatzan += 0.0035;
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
    private MRE4JL(): void {
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

    private MRE4(): void {
        if (0 === this.floor(this.zvbezj)) {
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
                this.fvbz = this.floor(this.ceil((tab3 / 12) * this.zmvb));
                break;
            default:
                this.vbezb = this.vbezm * 12 + this.vbezs;
                this.hfvb = tab2;
                this.fvbz = this.floor(this.ceil(tab3));
        }

        this.fvb = this.ceil(this.vbezb * tab1) / 100;

        if (this.fvb > this.hfvb) {
            this.fvb = this.hfvb;
        }

        if (this.fvb > this.zvbezj) {
            this.fvb = this.zvbezj;
        }

        this.fvbso = this.ceil(this.fvb + this.vbezbso * tab1) / 100;

        if (this.fvbso > tab2) {
            this.fvbso = tab2;
        }

        this.hfvbzso = (this.vbezb + this.vbezbso) / 100 - this.fvbso;
        this.fvbzso = this.floor(this.ceil(this.fvbz + this.vbezbso / 100));

        if (this.fvbzso > this.hfvbzso) {
            this.fvbzso = this.floor(this.ceil(this.hfvbzso));
        }

        if (this.fvbzso > tab3) {
            this.fvbzso = this.floor(tab3);
        }

        this.hfvbz = this.vbezb / 100 - this.fvb;

        if (this.fvbz > this.hfvbz) {
            this.fvbz = this.floor(this.ceil(this.hfvbz));
        }

        this.alte = this.MRE4ALTE();
    }

    /**
     * Altersentlastungsbetrag (§ 39b Absatz 2 Satz 3 EStG)
     */
    private MRE4ALTE(): number {
        if (!this.alter1) {
            return 0.0;
        }

        if (null === this.ajahr) {
            throw new Error('ajahr not set');
        }

        let k = 36;

        if (this.ajahr < 2006) {
            k = 1;
        } else if (this.ajahr < 2040) {
            k = this.ajahr - 2004;
        }

        const bmg = this.zre4j - this.zvbezj,
            tab4 = this.TAB4[k],
            tab5 = this.TAB5[k];

        if (null === tab4 || null === tab5) {
            throw new Error('invalid year selected');
        }

        let alte = this.ceil(bmg * tab4);

        if (alte > tab5) {
            alte = tab5;
        }

        return alte;
    }

    /**
     * Abzug der Freibeträge nach § 39b Absatz 2 Satz 3 und 4 EStG vom Jahresarbeitslohn
     */
    private MRE4ABZ(): void {
        this.zre4 = this.zre4j - this.fvb - this.alte - this.jlfreib + this.jlhinzu;

        if (0 > this.zre4) {
            this.zre4 = 0.0;
        }

        this.zre4vp = this.zre4j;

        if (this.KENNVMT_VS === this.kennvmt) {
            this.zre4vp -= this.entsch / 100;
        }

        this.zvbez = this.zvbezj - this.fvb;

        if (0 <= this.zvbez) {
            return;
        }

        this.zvbez = 0.0;
    }

    /**
     * Ermittlung der Jahreslohnsteuer auf laufende Bezüge
     */
    private MBERECH(): void {
        const anp: number = this.MZTABFB();

        this.vfrb = this.floor((anp + this.fvb + this.fvbz) * 100);

        const st: number = this.MLSTJAHR();

        this.wvfrb = this.floor((this.zve - this.gfb) * 100);

        if (0 > this.wvfrb) {
            this.wvfrb = 0;
        }

        const lstjahr: number = st * this.f;

        //console.log('::MBERECH::', this.stkl, this.re4, this.lzz, this.krv, this.pvz, this.r, this.kvz, this.zkf, this.pkv, this.pvs, this.af, this.bk, this.bks, this.bkv, st, this.f, this.wvfrb);

        // Ermittlung des Anteils der Jahreslohnsteuer für den Lohnzahlungszeitraum
        this.lstlzz = this.floor(this.UPLSTLZZ(lstjahr));

        // Ermittlung des Anteils der berücksichtigten Vorsorgeaufwendungen für den Lohnzahlungszeitraum
        this.vkvlzz = this.floor(this.UPVKVLZZ(this.vsp2, this.vsp3));

        if (0.0 < this.zkf) {
            this.ztabfb += this.kfb;

            this.MRE4ABZ();
            const st: number = this.MLSTJAHR();

            this.jbmg = this.floor(st * this.f);
        } else {
            this.jbmg = this.floor(lstjahr);
        }

        this.MSOLZ();
    }

    /**
     * Ermittlung der festen Tabellenfreibeträge (ohne Vorsorgepauschale)
     */
    private MZTABFB(): number {
        let anp = 0;

        // Mögliche Begrenzung des Zuschlags zum Versorgungsfreibetrag, und Festlegung und Begrenzung Werbungskosten-Pauschbetrag für Versorgungsbezüge
        if (0.0 <= this.zvbez && this.zvbez < this.fvbz) {
            this.fvbz = this.floor(this.zvbez);
        }

        if (TAX.STKL_VI === this.stkl) {
            this.fvbz = 0;
            this.fvbzso = 0;
        } else {
            if (0.0 < this.zvbez) {
                if (102 > this.zvbez - this.fvbz) {
                    anp = this.floor(this.ceil(this.zvbez - this.fvbz));
                } else {
                    anp = 102;
                }
            }

            // Festlegung Arbeitnehmer-Pauschbetrag für aktiven Lohn mit möglicher Begrenzung
            if (this.zre4 > this.zvbez) {
                if (1200 > this.zre4 - this.zvbez) {
                    anp = this.floor(this.ceil(anp + this.zre4 - this.zvbez));
                } else {
                    anp += 1200;
                }
            }
        }

        let efa = 0;
        let sap = 0;
        this.kfb = 0;
        this.kztab = this.KZTAB_GRUNDTARIF;

        if (TAX.STKL_I === this.stkl) {
            sap = 36;
            this.kfb = this.floor(this.zkf * 8952);
        } else if (TAX.STKL_II === this.stkl) {
            efa = 4008;
            sap = 36;
            this.kfb = this.floor(this.zkf * 8952);
        } else if (TAX.STKL_III === this.stkl) {
            this.kztab = this.KZTAB_SPLITTINGVERFAHREN;
            sap = 36;
            this.kfb = this.floor(this.zkf * 8952);
        } else if (TAX.STKL_IV === this.stkl) {
            sap = 36;
            this.kfb = this.floor(this.zkf * 4476);
        } else if (TAX.STKL_V === this.stkl) {
            sap = 36;
        } else if (TAX.STKL_VI !== this.stkl) {
            throw new Error('invalid tax class ' + this.stkl.toString());
        }

        // Berechnung der Tabellenfreibeträge ohne Freibeträge für Kinder für die Lohnsteuerberechnung
        this.ztabfb = efa + anp + sap + this.fvbz;

        return anp;
    }

    /**
     * Ermittlung Jahreslohnsteuer
     */
    private MLSTJAHR(): number {
        const vsp = this.UPEVP();

        //console.log('::MLSTJAHR::', vsp, this.KENNVMT_MT !== this.kennvmt);

        if (this.KENNVMT_MT !== this.kennvmt) {
            this.zve = this.zre4 - this.ztabfb - vsp;

            return this.UPMLST();
        }

        this.zve = this.zre4 - this.ztabfb - vsp - this.vmt / 100 - this.vkapa / 100;

        if (0 > this.zve) {
            // Sonderfall des negativen verbleibenden zvE nach § 34 Absatz 1 Satz 3 EStG
            this.zve = (this.zve + this.vmt / 100 + this.vkapa / 100) / 5;

            const st = this.UPMLST();

            return st * 5;
        }

        // Steuerberechnung ohne Einkünfte nach § 34 EStG
        const stovmt = this.UPMLST();

        // Steuerberechnung mit Einkünften nach § 34 EStG
        this.zve += (this.vmt + this.vkapa) / 500;

        const st = this.UPMLST();

        return (st - stovmt) * 5 + stovmt;
    }

    /**
     * Vorsorgepauschale (§ 39b Absatz 2 Satz 5 Nummer 3 und Absatz 4 EStG)
     */
    private UPEVP(): number {
        let vsp1 = 0.0;

        //console.log('::UPEVP::1::', vsp1, this.KRV_SONST !== this.krv);

        if (this.KRV_SONST !== this.krv) {
            //console.log('::UPEVP::2::', this.zre4vp > this.bbgrv);
            if (this.zre4vp > this.bbgrv) {
                this.zre4vp = this.bbgrv;
            }

            vsp1 = this.tbsvorv * this.zre4vp * this.rvsatzan;
            //console.log('::UPEVP::3::', this.tbsvorv, this.zre4vp, this.rvsatzan, this.tbsvorv * this.zre4vp * this.rvsatzan);
        }

        this.vsp2 = 0.12 * this.zre4vp;

        let vhb: number;

        if (TAX.STKL_III === this.stkl) {
            vhb = 3000.0;
        } else {
            vhb = 1900.0;
        }

        if (this.vsp2 > vhb) {
            this.vsp2 = vhb;
        }

        const vspn = this.ceil(vsp1 + this.vsp2);
        const vsp = this.MVSP(vsp1);

        if (vspn <= vsp) {
            return vsp;
        }

        return vspn;
    }

    /**
     * Vorsorgepauschale (§ 39b Absatz 2 Satz 5 Nummer 3 EStG) Vergleichsberechnung zur Mindestvorsorgepauschale
     */
    private MVSP(vsp1: number): number {
        if (this.zre4vp > this.bbgkvpv) {
            this.zre4vp = this.bbgkvpv;
        }

        if (null === this.pkv) {
            throw new Error('pkv not set');
        }

        if (this.PKV_GES < this.pkv) {
            if (TAX.STKL_VI === this.stkl) {
                this.vsp3 = 0.0;
            } else {
                this.vsp3 = (this.pkpv * 12) / 100;

                if (this.PKV_PRI_MAGZ === this.pkv) {
                    this.vsp3 -= this.zre4vp * (this.kvsatzag + this.pvsatzag);
                }
            }
        } else {
            this.vsp3 = this.zre4vp * (this.kvsatzan + this.pvsatzan);
        }

        return this.ceil(this.vsp3 + vsp1);
    }

    private UPMLST(): number {
        let x: number;

        if (1.0 > this.zve) {
            this.zve = 0.0;
            x = 0.0;
        } else {
            if (null === this.kztab) {
                throw new Error('kztab not set');
            }

            x = this.floor(this.zve / this.kztab);
        }

        if (TAX.STKL_V > this.stkl) {
            return this.UPTAB23(x);
        }

        return this.MST56(x);
    }

    /**
     * Lohnsteuer für die Steuerklassen V und VI (§ 39b Absatz 2 Satz 7 EStG)
     */
    private MST56(x: number): number {
        const zzx = x;

        if (zzx > this.w2stkl5) {
            let st = this.UP56(this.w2stkl5);

            if (zzx > this.w3stkl5) {
                st = this.floor(st + (this.w3stkl5 - this.w2stkl5) * 0.42);

                return this.floor(st + (zzx - this.w3stkl5) * 0.45);
            }

            return this.floor(st + (zzx - this.w2stkl5) * 0.42);
        }

        let st = this.UP56(this.floor(zzx));

        if (zzx > this.w1stkl5) {
            const vergl = st;
            st = this.UP56(this.w1stkl5);
            const hoch = this.floor(st + (zzx - this.w1stkl5) * 0.42);

            return this.floor(Math.min(hoch, vergl));
        }

        return st;
    }

    private UP56(zx: number): number {
        const st1 = this.UPTAB23(zx * 1.25);
        const st2 = this.UPTAB23(zx * 0.75);

        const diff = (st1 - st2) * 2;
        const mist = this.floor(zx * 0.14);

        return this.floor(Math.max(mist, diff));
    }

    /**
     * Tarifliche Einkommensteuer (§ 32a EStG)
     */
    private UPTAB23(x: number): number {
        if (x < this.gfb + 1) {
            return 0;
        }

        let st: number;

        if (16000 > x) {
            const y: number = (x - this.gfb) / 10000;
            let rw: number = y * 979.18;
            rw += 1400;
            st = this.floor(rw * y);
        } else if (62810 > x) {
            const y: number = (x - 15999) / 10000;
            let rw: number = y * 192.59;
            rw += 2397;
            rw *= y;
            st = this.floor(rw + 966.53);
        } else if (277826 > x) {
            st = this.floor(x * 0.42 - 9972.98);
        } else {
            st = this.floor(x * 0.45 - 18307.73);
        }

        if (null === this.kztab) {
            throw new Error('kztab not set');
        }

        return this.floor(st * this.kztab);
    }

    private UPLSTLZZ(lstjahr: number): number {
        return this.UPANTEIL(lstjahr * 100);
    }

    /**
     * Anteil von Jahresbeträgen für einen LZZ (§ 39b Absatz 2 Satz 9 EStG)
     */
    private UPANTEIL(jw: number): number {
        if (this.lzz === LZZ.LZZ_JAHR) {
            return this.floor(jw);
        }

        if (this.lzz == LZZ.LZZ_MONAT) {
            return this.floor(jw / 12);
        }

        if (this.lzz == LZZ.LZZ_WOCHE) {
            return this.floor((jw * 7) / 360);
        }

        return this.floor(jw / 360);
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

        return this.floor(Math.max(vsp2, vsp3) * 100);
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
            let solzj = this.floor(this.jbmg * 5.5) / 100;
            const solzmin = ((this.jbmg - this.solzfrei) * 11.9) / 100;

            if (solzmin < solzj) {
                solzj = solzmin;
            }

            this.solzlzz = this.floor(this.UPANTEIL(solzj * 100));
        } else {
            this.solzlzz = 0;
        }

        // Aufteilung des Betrages nach § 51a EStG auf den LZZ für die Kirchensteuer
        if (0 < this.r) {
            this.bk = this.floor(this.UPANTEIL(this.jbmg * 100));
        } else {
            this.bk = 0;
        }
    }

    private MSONST(): void {
        this.lzz = 1;

        if (0 === this.zmvb) {
            this.zmvb = 12;
        }

        if (0 === this.sonstb && 0 === this.mbv) {
            this.vkvsonst = 0;
            this.lstso = 0;
            this.sts = 0;
            this.solzs = 0;
            this.bks = 0;

            return;
        }

        const lstoso = this.MOSONST();
        let vkv: number = this.UPVKV(this.vsp2, this.vsp3);

        this.vkvsonst = vkv;
        this.zre4j = (this.jre4 + this.sonstb) / 100;
        this.zvbezj = (this.jvbez + this.vbs) / 100;
        this.vbezbso = this.sterbe;

        this.MRE4SONST();
        const st = this.MLSTJAHR();

        this.wvfrbm = (this.zve - this.gfb) * 100;

        if (0 > this.wvfrbm) {
            this.wvfrbm = 0;
        }

        vkv = this.UPVKV(this.vsp2, this.vsp3);

        this.vkvsonst = vkv - this.vkvsonst;
        this.lstso = st * 100;
        this.sts = this.floorByValue((this.lstso - lstoso) * this.f);

        this.STSMIN();
    }

    private STSMIN(): void {
        if (0 > this.sts) {
            if (0 !== this.mbv) {
                this.lstlzz += this.sts;

                if (0 > this.lstlzz) {
                    this.lstlzz = 0;
                }

                this.solzlzz = this.floor(this.solzlzz + this.sts * 5.5) / 100;

                if (0 > this.solzlzz) {
                    this.solzlzz = 0;
                }

                this.bk += this.sts;

                if (0 > this.bk) {
                    this.bk = 0;
                }
            }

            // Negative Lohnsteuer auf sonstigen Bezug wird nicht zugelassen.
            this.sts = 0;
            this.solzs = 0;
        } else {
            this.solzs = this.MSOLZSTS();
        }

        if (0 < this.r) {
            this.bks = this.sts;

            return;
        }

        this.bks = 0;
    }

    /**
     * Berechnung des SolZ auf sonstige Bezüge
     */
    private MSOLZSTS(): number {
        let solzszve: number;

        if (0 < this.zkf) {
            solzszve = this.zve - this.kfb;
        } else {
            solzszve = this.zve;
        }

        let x: number;

        if (1 > solzszve) {
            solzszve = 0;
            x = 0.0;
        } else {
            if (null === this.kztab) {
                throw new Error('kztab not set');
            }

            x = this.floor(solzszve / this.kztab);
        }

        let st: number;

        if (TAX.STKL_V > this.stkl) {
            st = this.UPTAB23(x);
        } else {
            st = this.MST56(x);
        }

        const solzsbmg = this.floor(st * this.f);

        if (solzsbmg > this.solzfrei) {
            return this.floor(this.sts * 5.5) / 100;
        }

        return 0;
    }

    /**
     * Sonderberechnung ohne sonstige Bezüge für Berechnung bei sonstigen Bezügen oder Vergütung für mehrjährige Tätigkeit
     */
    private MOSONST(): number {
        this.zre4j = this.jre4 / 100;
        this.zvbezj = this.jvbez / 100;
        this.jlfreib = this.jfreib / 100;
        this.jlhinzu = this.jhinzu / 100;

        this.MRE4();
        this.MRE4ABZ();

        this.zre4vp = this.zre4vp - this.jre4ent / 100;

        const anp = this.MZTABFB();

        this.vfrbs1 = (anp + this.fvb + this.fvbz) * 100;

        const st = this.MLSTJAHR();

        this.wvfrbo = (this.zve - this.gfb) * 100;

        if (0 > this.wvfrbo) {
            this.wvfrbo = 0;
        }

        return st * 100;
    }

    private MRE4SONST(): void {
        this.MRE4();

        this.fvb = this.fvbso;

        this.MRE4ABZ();

        this.zre4vp = this.zre4vp + this.mbv / 100 - this.jre4ent / 100 - this.sonstent / 100;
        this.fvbz = this.fvbzso;

        const anp = this.MZTABFB();

        this.vfrbs2 = (anp + this.fvb + this.fvbz) * 100 - this.vfrbs1;
    }

    /**
     * Berechnung der Entschädigung und Vergütung für mehrjährige Tätigkeit nach § 39b Absatz 3 Satz 9 und 10 EStG
     */
    private MVMT(): void {
        if (this.vkapa < 0) {
            this.vkapa = 0;
        }

        this.stv = 0;
        this.solzv = 0;
        this.bkv = 0;

        if (this.vmt + this.vkapa <= 0) {
            return;
        }

        let lst1: number;

        if (this.lstso === 0) {
            lst1 = this.MOSONST();
        } else {
            lst1 = this.lstso;
        }

        this.vbezbso = this.sterbe + this.vkapa;
        this.zre4j = (this.jre4 + this.sonstb + this.vmt + this.vkapa) / 100;
        this.zvbezj = (this.jvbez + this.vbs + this.vkapa) / 100;

        this.kennvmt = this.KENNVMT_VS;

        this.MRE4SONST();

        let lst3 = this.MLSTJAHR() * 100;

        this.MRE4ABZ();

        this.zre4vp -= this.jre4ent / 100 - this.sonstent / 100;
        this.kennvmt = this.KENNVMT_MT;

        this.stv = this.MLSTJAHR() * 100 - lst1;
        lst3 -= lst1;

        if (lst3 < this.stv) {
            this.stv = lst3;
        }

        if (this.stv < 0) {
            this.stv = 0;
        } else {
            this.stv = this.floor(this.stv * this.f);
        }

        this.solzvbmg = this.stv / 100 + this.jbmg;

        if (this.solzvbmg > this.solzfrei) {
            this.solzv = this.floor(this.stv * 5.5) / 100;
        } else {
            this.solzv = 0;
        }

        if (this.r > 0) {
            this.bkv = this.stv;

            return;
        }

        this.bkv = 0;
    }

    /**
     * Abrunden nach Betrag, d.h. Kommastellen immer abschneiden, egal welches Vorzeichen
     */
    private floorByValue(value: number): number {
        value = this.fixPrecision(value);

        return 0 <= value ? Math.floor(value) : Math.ceil(value);
    }

    /**
     * Abrunden
     */
    private floor(value: number): number {
        return Math.floor(this.fixPrecision(value));
    }

    /**
     * Aufrunden
     */
    private ceil(value: number): number {
        return Math.ceil(this.fixPrecision(value));
    }

    /**
     * Float-Werte können binär nicht immer exakt gespeichert werden. Ein Abrunden von 3 ergibt dann u.U eine 2,
     * weil diese intern als 2.99999999999135 hinterlegt ist. Durch eine grobe kaufmännische Vor-Rundung lässt sich
     * das vermeiden.
     */
    private fixPrecision(value: number): number {
        const factor = 10000;

        return Math.round(value * factor) / factor;
    }
}
