import type { Generator } from '../generator';
import ce2AdditionPosee from './ce2/addition-posee';
import ce2ComparerRangerNombres from './ce2/comparer-ranger-nombres';
import ce2DoublesMoities from './ce2/doubles-moities';
import ce2FractionsUnitaires from './ce2/fractions-unitaires';
import ce2LongueursConversions from './ce2/longueurs-conversions';
import ce2MultiplicationPosee from './ce2/multiplication-posee';
import ce2TablesMultiplication from './ce2/tables-multiplication';
import cm1ComparerDecimaux from './cm1/comparer-decimaux';
import cm1DivisionEuclidienne from './cm1/division-euclidienne';
import cm1FractionsDroiteGraduee from './cm1/fractions-droite-graduee';
import cm1NombresDecimaux from './cm1/nombres-decimaux';
import cm1Perimetre from './cm1/perimetre';
import cm1Proportionnalite from './cm1/proportionnalite';
import cm2AdditionSoustractionDecimaux from './cm2/addition-soustraction-decimaux';
import cm2AireRectangle from './cm2/aire-rectangle';
import cm2ExpressionsInconnue from './cm2/expressions-inconnue';
import cm2FractionsAdditionMemeDenominateur from './cm2/fractions-addition-meme-denominateur';
import cm2FractionsDecimauxEquivalences from './cm2/fractions-decimaux-equivalences';
import cm2MultiplesDiviseurs from './cm2/multiples-diviseurs';
import cm2Pourcentages from './cm2/pourcentages';
import sixiemeAnglesDegres from './sixieme/angles-degres';
import sixiemeFractionDUneQuantite from './sixieme/fraction-d-une-quantite';
import sixiemeNombresPremiers from './sixieme/nombres-premiers';
import sixiemePrioritesOperatoires from './sixieme/priorites-operatoires';
import sixiemeProbabilites from './sixieme/probabilites';
import sixiemeProportionnalite from './sixieme/proportionnalite';
import cinquiemeFractionsAddition from './cinquieme/fractions-addition';
import cinquiemePuissancesDe10 from './cinquieme/puissances-de-10';
import cinquiemeRelatifsAdditionSoustraction from './cinquieme/relatifs-addition-soustraction';
import cinquiemeTesterEgalite from './cinquieme/tester-egalite';

/** Every generator, by grade. A new generator only needs a line here; the tests pick it up. */
export const generators: readonly Generator[] = [
  // CE2
  ce2AdditionPosee,
  ce2ComparerRangerNombres,
  ce2DoublesMoities,
  ce2FractionsUnitaires,
  ce2LongueursConversions,
  ce2MultiplicationPosee,
  ce2TablesMultiplication,
  // CM1
  cm1ComparerDecimaux,
  cm1DivisionEuclidienne,
  cm1FractionsDroiteGraduee,
  cm1NombresDecimaux,
  cm1Perimetre,
  cm1Proportionnalite,
  // CM2
  cm2AdditionSoustractionDecimaux,
  cm2AireRectangle,
  cm2ExpressionsInconnue,
  cm2FractionsAdditionMemeDenominateur,
  cm2FractionsDecimauxEquivalences,
  cm2MultiplesDiviseurs,
  cm2Pourcentages,
  // 6e
  sixiemeAnglesDegres,
  sixiemeFractionDUneQuantite,
  sixiemeNombresPremiers,
  sixiemePrioritesOperatoires,
  sixiemeProbabilites,
  sixiemeProportionnalite,
  // 5e
  cinquiemeFractionsAddition,
  cinquiemePuissancesDe10,
  cinquiemeRelatifsAdditionSoustraction,
  cinquiemeTesterEgalite,
];
