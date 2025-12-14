<?php
/**
 * LuchaFit - Anthropometric Calculations
 * 
 * Todas las fórmulas y cálculos antropométricos utilizados en el sistema
 * Basado en los estándares ISAK y protocolos internacionales
 */

class AnthroCalculations {
    
    /**
     * Referencia Phantom para cálculo de Z-Scores
     * Basado en Ross & Wilson
     */
    private static $PHANTOM_REF = [
        'mass' => ['mean' => 64.58, 'sd' => 8.60],
        'stature' => ['mean' => 170.18, 'sd' => 6.29],
        'sitting_height' => ['mean' => 89.92, 'sd' => 3.38],
        'arm_span' => ['mean' => 172.87, 'sd' => 8.14],
        'triceps' => ['mean' => 14.47, 'sd' => 4.42],
        'subscapular' => ['mean' => 16.14, 'sd' => 6.08],
        'biceps' => ['mean' => 6.62, 'sd' => 2.58],
        'iliac_crest' => ['mean' => 19.55, 'sd' => 7.14],
        'supraspinale' => ['mean' => 13.59, 'sd' => 5.58],
        'abdominal' => ['mean' => 25.09, 'sd' => 9.24],
        'thigh' => ['mean' => 22.09, 'sd' => 7.79],
        'calf' => ['mean' => 11.08, 'sd' => 4.42],
        'arm_relaxed' => ['mean' => 28.05, 'sd' => 2.88],
        'arm_flexed' => ['mean' => 30.19, 'sd' => 2.98],
        'waist' => ['mean' => 79.46, 'sd' => 7.46],
        'hips' => ['mean' => 96.05, 'sd' => 6.44],
        'mid_thigh' => ['mean' => 54.54, 'sd' => 5.05],
        'calf_girth' => ['mean' => 36.47, 'sd' => 2.81],
        'humerus' => ['mean' => 6.60, 'sd' => 0.41],
        'bistyloid' => ['mean' => 5.30, 'sd' => 0.33],
        'femur' => ['mean' => 9.13, 'sd' => 0.56]
    ];
    
    /**
     * Calcular BMI (Índice de Masa Corporal)
     */
    public static function calculateBMI($mass, $stature) {
        if ($stature == 0) return 0;
        return $mass / pow(($stature / 100), 2);
    }
    
    /**
     * Calcular Z-Score de una medida
     */
    public static function calculateZScore($value, $metricName) {
        if (!isset(self::$PHANTOM_REF[$metricName]) || $value == 0) {
            return 0;
        }
        
        $ref = self::$PHANTOM_REF[$metricName];
        return ($value - $ref['mean']) / $ref['sd'];
    }
    
    /**
     * Calcular perímetro corregido
     */
    public static function calculateCorrectedGirth($girthCm, $skinfoldMm) {
        return $girthCm - (pi() * ($skinfoldMm / 10));
    }
    
    /**
     * Calcular porcentaje de grasa corporal (Fórmula de Faulkner)
     */
    public static function calculateBodyFatFaulkner($triceps, $subscapular, $supraspinale, $abdominal) {
        $sum4 = $triceps + $subscapular + $supraspinale + $abdominal;
        return ($sum4 * 0.153) + 5.783;
    }
    
    /**
     * Calcular Somatotipo (Heath-Carter)
     */
    public static function calculateSomatotype($data) {
        $triceps = $data['triceps'] ?? 0;
        $subscapular = $data['subscapular'] ?? 0;
        $supraspinale = $data['supraspinale'] ?? 0;
        $humerus = $data['humerus'] ?? 0;
        $femur = $data['femur'] ?? 0;
        $arm_flexed = $data['arm_flexed'] ?? 0;
        $calf_girth = $data['calf_girth'] ?? 0;
        $stature = $data['stature'] ?? 0;
        $mass = $data['mass'] ?? 0;
        $calf_skinfold = $data['calf'] ?? 0;
        
        // Endomorphy
        $sum3 = $triceps + $subscapular + $supraspinale;
        $endo = -0.7182 + (0.1451 * $sum3) - (0.00068 * pow($sum3, 2)) + (0.0000014 * pow($sum3, 3));
        
        // Mesomorphy
        $arm_corr = $arm_flexed - ($triceps / 10);
        $calf_corr = $calf_girth - ($calf_skinfold / 10);
        $meso = (0.858 * $humerus) + (0.601 * $femur) + (0.188 * $arm_corr) + (0.161 * $calf_corr) - (0.131 * $stature) + 4.5;
        
        // Ectomorphy
        $hwr = $stature / pow($mass, 0.3333);
        $ecto = 0;
        if ($hwr >= 40.75) {
            $ecto = (0.732 * $hwr) - 28.58;
        } elseif ($hwr >= 38.25) {
            $ecto = (0.463 * $hwr) - 17.63;
        } else {
            $ecto = 0.1;
        }
        
        // Coordenadas para gráfico
        $x = $ecto - $endo;
        $y = (2 * $meso) - ($ecto + $endo);
        
        return [
            'endomorphy' => round($endo, 2),
            'mesomorphy' => round($meso, 2),
            'ectomorphy' => round($ecto, 2),
            'x' => round($x, 2),
            'y' => round($y, 2)
        ];
    }
    
    /**
     * Calcular composición corporal completa
     */
    public static function calculateBodyComposition($data) {
        $mass = $data['mass'] ?? 0;
        $stature = $data['stature'] ?? 0;
        $triceps = $data['triceps'] ?? 0;
        $subscapular = $data['subscapular'] ?? 0;
        $supraspinale = $data['supraspinale'] ?? 0;
        $abdominal = $data['abdominal'] ?? 0;
        
        $bmi = self::calculateBMI($mass, $stature);
        $bodyFatPercent = self::calculateBodyFatFaulkner($triceps, $subscapular, $supraspinale, $abdominal);
        $fatMass = ($bodyFatPercent / 100) * $mass;
        $leanMass = $mass - $fatMass;
        
        return [
            'bmi' => round($bmi, 2),
            'body_fat_percent' => round($bodyFatPercent, 2),
            'fat_mass' => round($fatMass, 2),
            'lean_mass' => round($leanMass, 2)
        ];
    }
    
    /**
     * Calcular distribución adiposa (porcentajes por región)
     */
    public static function calculateAdiposeDistribution($data) {
        $triceps = $data['triceps'] ?? 0;
        $subscapular = $data['subscapular'] ?? 0;
        $biceps = $data['biceps'] ?? 0;
        $iliac_crest = $data['iliac_crest'] ?? 0;
        $supraspinale = $data['supraspinale'] ?? 0;
        $abdominal = $data['abdominal'] ?? 0;
        $thigh = $data['thigh'] ?? 0;
        $calf = $data['calf'] ?? 0;
        
        $sumSkinfolds = $triceps + $subscapular + $biceps + $iliac_crest + 
                        $supraspinale + $abdominal + $thigh + $calf;
        
        if ($sumSkinfolds == 0) {
            return [
                'head' => 0, 'trunk' => 0, 'upper_limb' => 0, 'lower_limb' => 0
            ];
        }
        
        return [
            'head' => 0, // No se mide en ISAK estándar
            'trunk' => round((($subscapular + $iliac_crest + $supraspinale + $abdominal) / $sumSkinfolds) * 100, 1),
            'upper_limb' => round((($triceps + $biceps) / $sumSkinfolds) * 100, 1),
            'lower_limb' => round((($thigh + $calf) / $sumSkinfolds) * 100, 1)
        ];
    }
    
    /**
     * Calcular todos los Z-Scores de una medición
     */
    public static function calculateAllZScores($data) {
        $zScores = [];
        
        foreach (self::$PHANTOM_REF as $metric => $ref) {
            if (isset($data[$metric]) && $data[$metric] > 0) {
                $zScores[$metric] = round(self::calculateZScore($data[$metric], $metric), 2);
            }
        }
        
        return $zScores;
    }
    
    /**
     * Obtener interpretación de somatotipo
     */
    public static function getSomatotypeInterpretation($endo, $meso, $ecto) {
        $dominant = max($endo, $meso, $ecto);
        
        if ($dominant == $endo && $endo > 5) {
            return "Endomórfico dominante: Tendencia a acumular grasa, metabolismo lento.";
        } elseif ($dominant == $meso && $meso > 5) {
            return "Mesomórfico dominante: Estructura muscular desarrollada, respuesta favorable al entrenamiento.";
        } elseif ($dominant == $ecto && $ecto > 5) {
            return "Ectomórfico dominante: Estructura delgada y alargada, metabolismo acelerado.";
        } elseif (abs($endo - $meso) < 0.5 && abs($meso - $ecto) < 0.5) {
            return "Balanceado: Proporciones equilibradas entre los tres componentes.";
        } else {
            return "Mixto: Combinación de características de múltiples componentes.";
        }
    }
    
    /**
     * Obtener clasificación de BMI
     */
    public static function getBMIClassification($bmi) {
        if ($bmi < 18.5) return 'Bajo peso';
        if ($bmi < 25) return 'Normal';
        if ($bmi < 30) return 'Sobrepeso';
        if ($bmi < 35) return 'Obesidad Grado I';
        if ($bmi < 40) return 'Obesidad Grado II';
        return 'Obesidad Grado III';
    }
    
    /**
     * Calcular gasto energético basal (Harris-Benedict)
     */
    public static function calculateBMR($mass, $stature, $age, $gender) {
        if ($gender === 'Masculino') {
            return 88.362 + (13.397 * $mass) + (4.799 * $stature) - (5.677 * $age);
        } else {
            return 447.593 + (9.247 * $mass) + (3.098 * $stature) - (4.330 * $age);
        }
    }
    
    /**
     * Calcular gasto energético total (con factor de actividad)
     */
    public static function calculateTDEE($bmr, $activityLevel) {
        $factors = [
            'sedentary' => 1.2,
            'light' => 1.375,
            'moderate' => 1.55,
            'active' => 1.725,
            'very_active' => 1.9
        ];
        
        $factor = $factors[$activityLevel] ?? 1.2;
        return $bmr * $factor;
    }
}
?>
