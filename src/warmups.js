export const warmups = {
  PROP_DENSITY_01: [
    {
      prompt: "Cette huile, plus légère que l’eau, a une densité…",
      choices: [
        { id: "lt", label: "inférieure à 1" },
        { id: "eq", label: "égale à 1" },
        { id: "gt", label: "supérieure à 1" }
      ],
      correct: "lt",
      explain: "La densité est le rapport ρ/ρeau. Un fluide qui flotterait sur l’eau a ρ < 1000 kg/m³, donc d < 1. Le poids volumique γ = ρg est alors plus petit que celui de l’eau."
    }
  ],
  PROP_COMPRESS_01: [
    {
      prompt: "On comprime de l’eau de 1 bar à 100 bar. Le volume…",
      choices: [
        { id: "tiny", label: "diminue de moins de 1 %" },
        { id: "half", label: "diminue d’environ 50 %" },
        { id: "zero", label: "reste strictement constant" }
      ],
      correct: "tiny",
      explain: "L’eau est peu compressible : K ≈ 2,2 GPa. Même à 100 bar, la diminution relative n’est que de quelques dixièmes de pourcent. En génie civil, l’hypothèse d’incompressibilité est donc largement justifiée."
    }
  ],
  PROP_VISC_01: [
    {
      prompt: "Le film d’huile est plus mince, la plaque gardant la même vitesse. L’effort de traction…",
      choices: [
        { id: "up", label: "augmente" },
        { id: "down", label: "diminue" },
        { id: "same", label: "ne change pas" }
      ],
      correct: "up",
      explain: "Entre les deux plaques, le profil est linéaire : le gradient vaut U/e. Si e diminue à U constant, U/e augmente. Pour un fluide newtonien, τ = μ U/e donc F = τA augmente : un film plus mince « accroche » davantage."
    }
  ],
  PROP_VISCOMETER_02: [
    {
      prompt: "À rotation N constante, une huile plus visqueuse donne un couple mesuré…",
      choices: [
        { id: "up", label: "plus grand" },
        { id: "down", label: "plus petit" },
        { id: "same", label: "inchangé" }
      ],
      correct: "up",
      explain: "Le couple sur l’arbre équilibre le frottement visqueux dans l’entrefer. Plus μ est grand, plus τ = μ U/e est grand, plus C est grand. C’est pour cela qu’une mesure de couple permet de remonter à μ."
    }
  ],
  PROP_CAPILLARY_03: [
    {
      prompt: "Si le diamètre du tube de verre augmente, la hauteur capillaire…",
      choices: [
        { id: "down", label: "diminue" },
        { id: "up", label: "augmente" },
        { id: "same", label: "reste la même" }
      ],
      correct: "down",
      explain: "La tension sur le contour équilibre le poids de la colonne : h est inversement proportionnelle au diamètre. Un tube plus gros monte moins haut — d’où le diamètre minimal à donner à un piézomètre pour limiter l’erreur."
    }
  ],
  PROP_LAPLACE_04: [
    {
      prompt: "Une goutte deux fois plus petite qu’une autre a une surpression intérieure…",
      choices: [
        { id: "up", label: "plus grande" },
        { id: "down", label: "plus petite" },
        { id: "same", label: "identique" }
      ],
      correct: "up",
      explain: "Pour une goutte (une seule interface), Δp = 2σ/R. Plus le rayon est petit, plus la courbure est forte, plus la surpression est grande. Les très petites gouttes tiennent leur forme grâce à cette tension."
    }
  ],
  PROP_GAS_05: [
    {
      prompt: "On ramène cet air à la pression atmosphérique, à la même température. Son volume…",
      choices: [
        { id: "up", label: "augmente fortement" },
        { id: "down", label: "diminue" },
        { id: "liq", label: "reste presque constant, comme un liquide" }
      ],
      correct: "up",
      explain: "Pour un gaz parfait isotherme, p𝒱 est constant. Passer de 200 bar à environ 1 bar multiplie le volume par près de 200. Un liquide, à l’inverse, changerait à peine — c’est tout le contraste avec l’exercice de compressibilité."
    }
  ],
  HYDRO_LAYERS_01: [
    {
      prompt: "Par rapport à 5 m d’eau seule, la pression au fond de ce réservoir (2 m d’huile + 3 m d’eau) est…",
      choices: [
        { id: "low", label: "plus faible" },
        { id: "high", label: "plus forte" },
        { id: "same", label: "identique : seule la hauteur compte" }
      ],
      correct: "low",
      explain: "La pression s’additionne couche par couche : p = Σ ρ g h. L’huile (d = 0,85) pèse moins qu’une même hauteur d’eau. Cinq mètres de fluide ne font donc pas 5 mCE : le fond « sent » moins que de l’eau sur toute la hauteur."
    }
  ],
  HYDRO_MANO_01: [
    {
      prompt: "Le mercure est plus bas du côté A. La pression en A, comparée à B, est…",
      choices: [
        { id: "high", label: "plus élevée" },
        { id: "low", label: "plus basse" },
        { id: "eq", label: "égale : c’est le même fluide" }
      ],
      correct: "high",
      explain: "Le mercure est chassé vers le côté de plus faible pression. Ménisque plus bas côté A signifie p_A > p_B. La dénivellation des axes et les colonnes d’eau ne font que corriger ce terme dominant (ρ_Hg − ρ) g Δh."
    }
  ],
  HYDRO_PRESS_03: [
    {
      prompt: "Le grand piston a un diamètre 8 fois plus grand que le petit. Pour soulever la charge, l’effort sur le petit piston est…",
      choices: [
        { id: "64", label: "64 fois plus petit" },
        { id: "8", label: "8 fois plus petit" },
        { id: "same", label: "le même : Pascal égalise les forces" }
      ],
      correct: "64",
      explain: "Pascal égalise les pressions, pas les forces : F/A est le même, donc F₁/F₂ = (d/D)². Ici 8² = 64. Le volume d’huile se conserve : la course du petit piston est, elle, 64 fois plus grande. Le travail ne s’invente pas."
    }
  ],
  FORCE_GATE_02: [
    {
      prompt: "La résultante hydrostatique sur la vanne immergée s’applique…",
      choices: [
        { id: "below", label: "un peu sous le centre de la vanne" },
        { id: "g", label: "exactement au centre géométrique" },
        { id: "top", label: "à l’arête supérieure, près de la surface" }
      ],
      correct: "below",
      explain: "La pression augmente avec la profondeur : le bas de la vanne est plus chargé que le haut. La résultante passe donc sous le centre de gravité, tout en restant sur la vanne. Plus la vanne est profonde, plus ce décalage diminue."
    }
  ],
  FORCE_PLANE_01: [
    {
      prompt: "De la surface libre au pied du mur, le diagramme des pressions a la forme…",
      choices: [
        { id: "tri", label: "d’un triangle" },
        { id: "rect", label: "d’un rectangle" },
        { id: "par", label: "d’une parabole" }
      ],
      correct: "tri",
      explain: "Au repos, p = ρ g h : nulle à la surface, maximale au pied, et linéaire entre les deux. L’aire de ce triangle donne la poussée par mètre de largeur ; son centre de gravité est à H/3 au-dessus du pied, d’où le moment de renversement."
    }
  ],
  HYDRO_INCLINED_06: [
    {
      prompt: "On incline davantage la paroi (α diminue) sans changer la profondeur du centre de la vanne. La poussée F…",
      choices: [
        { id: "same", label: "ne change pas" },
        { id: "down", label: "diminue" },
        { id: "up", label: "augmente" }
      ],
      correct: "same",
      explain: "F = ρ g A h_G ne dépend que de la profondeur verticale du centre, pas de l’inclinaison. α allonge le chemin le long de la paroi (y_G = h_G / sin α) et décale un peu le centre de poussée, mais l’intensité de F reste la même."
    }
  ],
  HYDRO_CURVED_07: [
    {
      prompt: "La composante verticale de la poussée sur ce quart de cylindre vaut…",
      choices: [
        { id: "above", label: "le poids de l’eau réellement au-dessus de la vanne" },
        { id: "quarter", label: "le poids d’un quart de cylindre plein d’eau" },
        { id: "fh", label: "exactement la composante horizontale" }
      ],
      correct: "above",
      explain: "Sur une paroi courbe, F_V est le poids du fluide qui appuie sur la face. Ici l’eau est au-dessus, côté concave : le volume est (carré − quart de cercle) × largeur, pas le quart de cylindre plein. F_H, elle, se lit sur la projection verticale."
    }
  ],
  HYDRO_ARCHIMEDE_08: [
    {
      prompt: "Le bloc de béton est entièrement immergé, suspendu à un câble. La tension du câble, comparée au poids dans l’air, est…",
      choices: [
        { id: "less", label: "plus petite" },
        { id: "eq", label: "la même" },
        { id: "zero", label: "nulle : Archimède porte tout" }
      ],
      correct: "less",
      explain: "Archimède retranche le poids du volume d’eau déplacé. Le béton (2400 kg/m³) reste plus lourd que l’eau : le câble tient le poids apparent, pas zéro. La poussée réduit ici le poids d’environ 40 %."
    },
    {
      prompt: "Le caisson flotte en mer si…",
      choices: [
        { id: "fa", label: "la poussée à immersion totale dépasse son poids" },
        { id: "sink", label: "son poids dépasse la poussée maximale" },
        { id: "dens", label: "sa densité est supérieure à celle de l’eau de mer" }
      ],
      correct: "fa",
      explain: "Il flotte dès que F_A,max = ρ g L B H est plus grand que le poids W. Le tirant d’eau s’ajuste alors pour que la poussée égale W, et il reste un franc-bord. Si W > F_A,max, le caisson coule."
    }
  ],
  HYDRO_STABILITY_04: [
    {
      prompt: "Après une petite inclinaison au roulis, le caisson se redresse si le métacentre M est…",
      choices: [
        { id: "above", label: "au-dessus de G" },
        { id: "below", label: "au-dessous de G" },
        { id: "b", label: "confondu avec le centre de carène B" }
      ],
      correct: "above",
      explain: "Le couple poids–poussée redresse lorsque M est au-dessus de G, c’est-à-dire lorsque GM > 0. B est le centre du volume immergé ; M est plus haut de BM = I/∇. Si G monte au-dessus de M, l’inclinaison s’amplifie."
    }
  ],
  HYDRO_DEPTH_01: [
    {
      prompt: "À 28 m en mer, la pression relative sur le plongeur, comparée à la pression atmosphérique, est…",
      choices: [
        { id: "few", label: "du même ordre, un peu plus forte" },
        { id: "times", label: "environ trois fois plus forte" },
        { id: "abs", label: "nulle : seule la pression absolue compte" }
      ],
      correct: "times",
      explain: "La pression relative est ρgh. Avec ρ ≈ 1025 kg/m³, 28 m d’eau de mer donnent ≈ 2,8 bar, soit près de trois atmosphères. La pression absolue ajoute encore p_atm : le plongeur subit donc ≈ 3,8 bar abs, pas « un peu plus que l’air »."
    }
  ],
  FORCE_CIRCULAR_03: [
    {
      prompt: "Sur cette vanne circulaire verticale entièrement immergée, le centre de poussée est…",
      choices: [
        { id: "below", label: "plus bas que le centre géométrique" },
        { id: "at", label: "confondu avec le centre du disque" },
        { id: "above", label: "plus haut, vers la surface libre" }
      ],
      correct: "below",
      explain: "La pression croît avec la profondeur, donc la résultante est décalée vers le bas : y_p = ȳ + I_G/(Aȳ). Pour un disque, I_G = πD⁴/64. Plus le disque est profond, plus l’écart y_p − ȳ diminue."
    }
  ],
  KIN_PIPE_01: [
    {
      prompt: "À débit constant, si le diamètre de la conduite est divisé par 2, la vitesse moyenne…",
      choices: [
        { id: "x4", label: "est multipliée par 4" },
        { id: "x2", label: "est multipliée par 2" },
        { id: "same", label: "ne change pas" }
      ],
      correct: "x4",
      explain: "Q = AV et A = πD²/4. Diviser D par 2 divise l’aire par 4, donc V × 4. C’est pour cela qu’un DN trop petit donne des vitesses trop élevées pour un réseau d’eau potable."
    }
  ],
  KIN_TWO_02: [
    {
      prompt: "Le diamètre passe de D₁ à D₂ = D₁/2, en régime permanent. Le débit dans le petit tronçon…",
      choices: [
        { id: "same", label: "est le même que dans le grand" },
        { id: "half", label: "est deux fois plus petit" },
        { id: "quarter", label: "est quatre fois plus petit" }
      ],
      correct: "same",
      explain: "Un fluide incompressible ne s’accumule nulle part : Q = A₁V₁ = A₂V₂. La section diminue, la vitesse augmente, le débit reste le même. Vérifier Q₁ = Q₂ est le contrôle de la continuité."
    }
  ],
  KIN_NODE_03: [
    {
      prompt: "Au nœud, un branchement soutire Qᵦ. Le débit dans la conduite 3 vaut…",
      choices: [
        { id: "inminus", label: "Q₁ + Q₂ − Qᵦ" },
        { id: "sum", label: "Q₁ + Q₂" },
        { id: "max", label: "le plus grand des débits entrants" }
      ],
      correct: "inminus",
      explain: "La loi des nœuds est un bilan de volume : tout ce qui entre ressort, ici vers 3 et vers le branchement. Donc Q₃ = Q₁ + Q₂ − Qᵦ. On n’additionne pas les vitesses, on additionne les débits."
    }
  ],
  KIN_ACCEL_04: [
    {
      prompt: "Dans ce convergent, le régime est permanent. Une particule d’eau…",
      choices: [
        { id: "acc", label: "accélère quand même, car la section se resserre" },
        { id: "zero", label: "a une accélération nulle : rien ne varie dans le temps" },
        { id: "dec", label: "ralentit, le débit étant constant" }
      ],
      correct: "acc",
      explain: "Permanent veut dire ∂V/∂t = 0 en un point fixe, pas a = 0 pour une particule. Dans le convergent, V augmente le long de x : l’accélération convective V dV/dx est positive. C’est ce terme que l’on calcule à mi-parcours."
    }
  ],
  KIN_RISE_05: [
    {
      prompt: "Le plan d’eau du réservoir monte si…",
      choices: [
        { id: "in", label: "le débit entrant dépasse le débit sortant" },
        { id: "out", label: "le débit sortant est plus grand" },
        { id: "eq", label: "les deux débits sont égaux, par continuité" }
      ],
      correct: "in",
      explain: "Le volume d’eau dans la cuve varie : A dh/dt = Qₑ − Qₛ. Si Qₑ > Qₛ, le niveau monte. L’égalité des débits n’est vraie que dans une conduite en régime permanent, pas dans un réservoir qui se remplit."
    }
  ],
  KIN_FILL_06: [
    {
      prompt: "Pour remplir le même volume dans le même temps sans dépasser V_max, un diamètre trop petit…",
      choices: [
        { id: "fast", label: "imposerait une vitesse trop élevée" },
        { id: "slow", label: "allongerait forcément la durée de remplissage" },
        { id: "ok", label: "convient : Q ne dépend pas de D" }
      ],
      correct: "fast",
      explain: "Le débit requis Q = 𝒱/t est fixé par le cahier des charges. Q = AV donc D_min = √(4Q/(πV_max)). En dessous, on respecterait le volume mais pas la vitesse maximale du réseau."
    }
  ],
  KIN_DIST_07: [
    {
      prompt: "Le long de cette rampe d’irrigation, le débit dans la conduite…",
      choices: [
        { id: "down", label: "diminue, l’eau étant prélevée en route" },
        { id: "same", label: "reste constant, comme dans une conduite fermée" },
        { id: "up", label: "augmente vers l’aval par accumulation" }
      ],
      correct: "down",
      explain: "Chaque arroseur soutire un peu d’eau. Si le prélèvement est uniforme, Q(x) = Qₑ − q x. À mi-longueur il reste (Qₑ + Qₛ)/2, pas le débit d’entrée."
    }
  ],
  BERNOULLI_VENTURI_01: [
    {
      prompt: "Au col du Venturi, la section diminue. La pression, comparée à l’entrée, …",
      choices: [
        { id: "down", label: "baisse" },
        { id: "up", label: "monte, l’eau étant « comprimée »" },
        { id: "same", label: "reste égale : conduite horizontale" }
      ],
      correct: "down",
      explain: "Continuité : V₂ > V₁. Bernoulli horizontal : p/ρg + V²/2g se conserve, donc si V² augmente, p diminue. C’est cette dépression que le manomètre au mercure mesure, et qui donne le débit."
    }
  ],
  BERNOULLI_TORRICELLI_02: [
    {
      prompt: "Si l’on double le diamètre de l’orifice, la charge h restant la même, la vitesse de sortie…",
      choices: [
        { id: "same", label: "reste essentiellement la même" },
        { id: "x4", label: "est multipliée par 4" },
        { id: "x2", label: "est multipliée par 2" }
      ],
      correct: "same",
      explain: "Torricelli : V = Cᵈ √(2gh). La vitesse dépend de la charge, pas du diamètre. En revanche le débit Q = Cᵈ A √(2gh) est multiplié par 4, car l’aire l’est. Un orifice plus gros évacue plus, sans « tirer » plus vite."
    }
  ],
  BERN_SECTIONS_03: [
    {
      prompt: "La conduite s’élève et se resserre. Au point 2, la pression, par rapport au point 1, …",
      choices: [
        { id: "down", label: "baisse, à la fois par la cote et par l’accélération" },
        { id: "up", label: "monte : l’eau « pousse » plus fort en haut" },
        { id: "zonly", label: "ne dépend que de Δz, la vitesse n’intervient pas" }
      ],
      correct: "down",
      explain: "Bernoulli : p/ρg + V²/2g + z = const. Ici z₂ > z₁ et V₂ > V₁ (section plus petite), donc p₂ < p₁ pour les deux raisons. Oublier le terme cinétique fausserait p₂."
    }
  ],
  BERN_PITOT_05: [
    {
      prompt: "Si la dénivellation de mercure du Pitot double, la vitesse locale…",
      choices: [
        { id: "sqrt2", label: "est multipliée par √2" },
        { id: "x2", label: "est multipliée par 2" },
        { id: "x4", label: "est multipliée par 4" }
      ],
      correct: "sqrt2",
      explain: "Le Pitot lit la pression dynamique ρV²/2, ici via (ρ_Hg − ρ)gΔh. Donc V ∝ √Δh : doubler Δh multiplie V par √2, pas par 2. Le mercure, plus dense, donne un Δh plus petit qu’un piézomètre à eau."
    }
  ],
  BERN_DRAIN_06: [
    {
      prompt: "Pendant la vidange, la charge diminue. Le débit instantané à l’orifice…",
      choices: [
        { id: "down", label: "diminue, car il suit √h" },
        { id: "const", label: "reste constant, comme un robinet ouvert" },
        { id: "up", label: "augmente : le réservoir « se vide de plus en plus vite »" }
      ],
      correct: "down",
      explain: "À chaque instant Q = Cᵈ a √(2gh). Plus le niveau baisse, plus le jet est lent. Le temps de vidange n’est donc pas Δh/V₀ : il s’intègre en (√h₁ − √h₂) et les dernières décimètres sont les plus longs."
    }
  ],
  BERN_SIPHON_07: [
    {
      prompt: "Au point haut du siphon, la pression relative est…",
      choices: [
        { id: "neg", label: "négative : dépression, risque de cavitation" },
        { id: "atm", label: "nulle, comme à la surface libre" },
        { id: "pos", label: "positive, l’eau y « pèse »" }
      ],
      correct: "neg",
      explain: "La vitesse est dictée par la dénivellation de sortie, pas par le point haut. Entre la surface et le sommet on « paie » ρgz_C + ρV²/2, d’où une dépression. Si p_abs s’approche de la vapeur saturante, le siphon se désamorce."
    }
  ],
  BERN_PUMP_08: [
    {
      prompt: "Des pertes de charge apparaissent sur le trajet. La HMT de la pompe, comparée à la seule hauteur géométrique, …",
      choices: [
        { id: "up", label: "augmente : la pompe doit aussi vaincre les pertes" },
        { id: "down", label: "diminue, les pertes « aident » le refoulement" },
        { id: "same", label: "reste égale à H_g" }
      ],
      correct: "up",
      explain: "HMT = H_g + Σh_f. Les pertes sont de l’énergie mécanique dissipée : la pompe doit les fournir en plus du dénivelé. La puissance absorbée P = ρgQHMT/η suit la même hausse."
    }
  ],
  MOMENTUM_JET_01: [
    {
      prompt: "Si la vitesse du jet double (même diamètre), la force sur la plaque fixe…",
      choices: [
        { id: "x4", label: "est multipliée par 4" },
        { id: "x2", label: "est multipliée par 2" },
        { id: "same", label: "ne change pas : la plaque arrête toujours le jet" }
      ],
      correct: "x4",
      explain: "La plaque annule la quantité de mouvement axiale : F = ρQV. Or Q = AV, donc F = ρAV². Doubler V multiplie Q par 2 et F par 4. Un jet plus rapide frappe beaucoup plus fort."
    }
  ],
  MOMENTUM_DEFLECT_02: [
    {
      prompt: "Un auget qui retourne le jet à 180°, comparé à une plaque qui l’arrête (90°), exerce une force…",
      choices: [
        { id: "double", label: "environ deux fois plus grande" },
        { id: "half", label: "deux fois plus petite" },
        { id: "same", label: "la même : seul compte ρQV" }
      ],
      correct: "double",
      explain: "Plaque normale : ΔV_x = V, F = ρQV. Retournement 180° : ΔV_x = 2V, F = 2ρQV. L’auget en U « pousse » deux fois plus parce qu’il inverse la vitesse, pas seulement l’annule. À 135°, on est entre les deux."
    }
  ],
  MOM_BUCKET_03: [
    {
      prompt: "L’auget avance dans le sens du jet. La force, comparée à l’auget fixe, …",
      choices: [
        { id: "less", label: "diminue : la vitesse relative est V − u" },
        { id: "more", label: "augmente, l’auget « attaque » le jet" },
        { id: "same", label: "reste 2ρQV" }
      ],
      correct: "less",
      explain: "Seul le débit relatif frappe l’auget : F = 2ρA(V − u)². Si u = 0 on retrouve 2ρQV ; si u → V, F → 0. La puissance Fu est maximale vers u = V/3, pas à l’arrêt."
    }
  ],
  MOM_ELBOW_04: [
    {
      prompt: "Même si le débit était nul, l’eau sous pression dans ce coude à 90°…",
      choices: [
        { id: "push", label: "exercerait encore une force d’ancrage (pA sur chaque face)" },
        { id: "zero", label: "n’exercerait aucune force : pas de quantité de mouvement" },
        { id: "onlyv", label: "ne pousserait que selon la bissectrice du virage" }
      ],
      correct: "push",
      explain: "Le bilan de quantité de mouvement contient les forces de pression pA. À l’arrêt, elles restent et tendent à « ouvrir » le coude. En charge, on ajoute ρQ(V⃗_out − V⃗_in). Souvent pA domine largement ρQV."
    }
  ],
  MOM_CONV_05: [
    {
      prompt: "Dans le convergent, l’eau accélère. L’effort axial de l’eau sur la paroi…",
      choices: [
        { id: "back", label: "tend plutôt à tirer le convergent vers l’amont (recul)" },
        { id: "fwd", label: "pousse forcément le convergent vers l’aval" },
        { id: "zero", label: "est nul : fluide parfait, diamètre variable" }
      ],
      correct: "back",
      explain: "L’eau sort plus vite qu’elle n’entre : sa quantité de mouvement axiale augmente. La paroi lui fournit cette impulsion, donc l’eau réagit en tirant le convergent vers l’amont. Bernoulli donne aussi p₂ < p₁, ce qui renforce le recul."
    }
  ],
  MOM_REACT_06: [
    {
      prompt: "Le réservoir éjecte un jet horizontal. Pour qu’il ne parte pas en recul, la force de retenue vaut…",
      choices: [
        { id: "rhoqv", label: "ρQV, égale à la quantité de mouvement éjectée par seconde" },
        { id: "weight", label: "le poids de l’eau restante" },
        { id: "pA", label: "uniquement pA sur la paroi opposée à l’orifice" }
      ],
      correct: "rhoqv",
      explain: "Chaque seconde, une masse ρQ quitte le réservoir à la vitesse V : il faut retenir ρQV (et avec V = √(2gh) on retrouve 2ρghA). Le poids est vertical ; il ne retient pas le recul horizontal."
    }
  ],
  MOM_INCLINE_07: [
    {
      prompt: "Sur la plaque lisse inclinée, le débit se partage. La nappe du côté « aval » (petit angle)…",
      choices: [
        { id: "more", label: "emporte plus d’eau que la nappe amont" },
        { id: "half", label: "emporte exactement la moitié, plaque lisse" },
        { id: "zero", label: "est nulle : tout glisse vers le bas" }
      ],
      correct: "more",
      explain: "Sans frottement il n’y a pas de force tangentielle : seule F_n dévie le jet. Le partage Q₊/Q₋ suit (1 ± cosθ) pour que la quantité de mouvement tangentielle se conserve. Plus θ est petit, plus Q₊ domine."
    }
  ],
  LOSSES_COLEBROOK_01: [
    {
      prompt: "À débit presque constant, si la conduite est deux fois plus longue, la perte de charge régulière h_f…",
      choices: [
        { id: "x2", label: "est à peu près doublée" },
        { id: "x4", label: "est multipliée par 4" },
        { id: "same", label: "ne dépend que de D et de λ, pas de L" }
      ],
      correct: "x2",
      explain: "Darcy : h_f = λ (L/D) V²/2g. λ varie peu si Re et ε/D sont inchangés. Donc h_f ∝ L : deux fois plus de tube, deux fois plus de frottement. D et V, eux, pèsent beaucoup plus fort (V² et 1/D⁵ via Q)."
    }
  ],
  LOSSES_MINOR_02: [
    {
      prompt: "Les pertes singulières (coudes, vanne, sortie) varient, à géométrie donnée, comme…",
      choices: [
        { id: "v2", label: "le carré de la vitesse" },
        { id: "v", label: "la vitesse, linéairement" },
        { id: "re", label: "1/Re, comme en laminaire" }
      ],
      correct: "v2",
      explain: "On écrit h_s = K V²/2g. Doubler le débit (donc V) quadruplerait ces pertes. Une vanne plus fermée, c’est un K plus grand, pas une autre puissance de V."
    }
  ],
  LOSS_RE_01: [
    {
      prompt: "Dans une conduite d’eau de réseau (D ~ 100 mm, V ~ 1 m/s), le régime est en pratique…",
      choices: [
        { id: "turb", label: "turbulent (Re ≫ 2300)" },
        { id: "lam", label: "laminaire, l’eau étant peu visqueuse" },
        { id: "plug", label: "un bloc qui glisse sans cisaillement" }
      ],
      correct: "turb",
      explain: "Re = VD/ν. Avec ν_eau ≈ 10⁻⁶ m²/s, Re ≈ 10⁵ : largement turbulent. Le laminaire n’apparaît que pour une huile très visqueuse, un tube capillaire, ou une vitesse minuscule."
    }
  ],
  LOSS_MOODY_03: [
    {
      prompt: "À l’extrême droite du diagramme de Moody (Re très grand), λ…",
      choices: [
        { id: "eps", label: "ne dépend plus que de ε/D (régime rugueux)" },
        { id: "re", label: "continue de baisser comme 64/Re" },
        { id: "zero", label: "tend vers 0 : plus de frottement" }
      ],
      correct: "eps",
      explain: "En turbulent rugueux, la sous-couche visqueuse est plus fine que les aspérités : λ = λ(ε/D) seulement. C’est la limite λ∞ de Colebrook. À gauche, laminaire, λ = 64/Re et la rugosité ne joue pas."
    }
  ],
  LOSS_DH_02: [
    {
      prompt: "Pour cette gaine rectangulaire pleine, le diamètre hydraulique Dₕ vaut…",
      choices: [
        { id: "4ap", label: "4A/P (quatre fois le rayon hydraulique)" },
        { id: "ab", label: "la moyenne (a+b)/2" },
        { id: "diag", label: "la diagonale √(a²+b²)" }
      ],
      correct: "4ap",
      explain: "Par définition Dₕ = 4A/P pour que le cercle redonne D. Une gaine très plate a un Dₕ proche de 2 fois la petite dimension, pas de la moyenne des côtés. C’est Dₕ qu’on met dans Re et dans Darcy."
    }
  ],
  LOSS_FILM_03: [
    {
      prompt: "Si le film ruisselant est plus épais, la vitesse en surface…",
      choices: [
        { id: "up", label: "augmente (profil ~ e²)" },
        { id: "down", label: "diminue, plus de frottement" },
        { id: "same", label: "reste g sinα, indépendante de e" }
      ],
      correct: "up",
      explain: "Nusselt laminaire : u(e) = ρg sinα e²/(2μ). Un film plus épais a plus de « place » loin de la paroi, donc une surface plus rapide, et un débit q ∝ e³. Il faut ensuite vérifier que Re reste laminaire."
    }
  ],
  LOSS_LAM_04: [
    {
      prompt: "Pour cette huile visqueuse en conduite, si Re < 2300, le facteur de Darcy λ vaut…",
      choices: [
        { id: "64", label: "64/Re (Poiseuille)" },
        { id: "moody", label: "la même lecture Moody que pour l’eau" },
        { id: "zero", label: "0 : écoulement à profil plat" }
      ],
      correct: "64",
      explain: "En laminaire, λ = 64/Re et h_f = 32μLV/(ρgD²). La rugosité n’entre pas. Une huile à μ = 0,12 Pa·s reste souvent laminaire là où l’eau serait déjà turbulente."
    }
  ],
  LOSS_GRAV_05: [
    {
      prompt: "Entre les deux réservoirs, la dénivelée H sert à…",
      choices: [
        { id: "losses", label: "équilibrer exactement les pertes linéaires et singulières" },
        { id: "ke", label: "créer une vitesse √(2gH) comme un orifice, sans frottement" },
        { id: "store", label: "stocker de la pression : le débit est libre" }
      ],
      correct: "losses",
      explain: "Les deux surfaces sont à l’air libre : Bernoulli réduit à H = λ(L/D)V²/2g + ΣK V²/2g. Toute la charge est mangée par les pertes. √(2gH) serait le cas sans tube, or ici le frottement limite fortement Q."
    }
  ],
  LOSS_SIZE_06: [
    {
      prompt: "Pour le même débit de projet, un diamètre commercial plus grand…",
      choices: [
        { id: "less", label: "diminue fortement h_f (V baisse, et h_f ~ V²/D)" },
        { id: "more", label: "augmente h_f : plus de paroi à frotter" },
        { id: "same", label: "laisse h_f inchangé si Q est imposé" }
      ],
      correct: "less",
      explain: "Q fixé ⇒ V ∝ 1/D² donc h_f ∝ V² L/D ∝ 1/D⁵. Passer au DN supérieur fait chuter les pertes. On retient le plus petit tube tel que h_f ≤ H, pas le plus grand « par sécurité hydraulique »."
    }
  ],
  LOSS_PUMP_07: [
    {
      prompt: "La HMT de cette station, comparée au seul dénivelé z₂ − z₁, …",
      choices: [
        { id: "up", label: "est plus grande : il faut aussi les pertes d’aspiration et de refoulement" },
        { id: "eq", label: "lui est égale, les diamètres se compensant" },
        { id: "down", label: "est plus petite grâce à l’aspiration" }
      ],
      correct: "up",
      explain: "HMT = (z₂ − z₁) + h_aspiration + h_refoulement. Le refoulement, plus long et souvent plus étroit, pèse en général plus que l’aspiration. La pompe fournit cette somme, pas seulement la géométrie."
    }
  ],
  LOSS_BORDA_08: [
    {
      prompt: "À travers l’élargissement brusque, la pression aval, malgré la perte de Borda…",
      choices: [
        { id: "up", label: "remonte (V diminue), mais moins que Bernoulli sans perte" },
        { id: "down", label: "chute forcément, toute perte baissant p" },
        { id: "same", label: "reste égale à p₁, conduite horizontale" }
      ],
      correct: "up",
      explain: "V₂ < V₁ donc une partie de V²/2g se reconvertit en pression. Borda retranche (V₁ − V₂)²/2g : la remontée de p est réelle, mais incomplète. Ce n’est pas un Venturi, il y a décollement."
    }
  ],
  SIM_FROUDE_01: [
    {
      prompt: "Sur ce modèle à surface libre (Froude), la vitesse en vraie grandeur, comparée au modèle, est…",
      choices: [
        { id: "faster", label: "plus grande : λ_V = √N" },
        { id: "same", label: "la même, l’eau étant le même fluide" },
        { id: "slower", label: "plus petite : le prototype est plus lent" }
      ],
      correct: "faster",
      explain: "Fr = V/√(gL) identique ⇒ V_p/V_m = √(L_p/L_m) = √N. Le prototype, plus grand, va plus vite. Le débit, lui, scale en N^{5/2}. Ce n’est pas la similitude de Reynolds."
    }
  ],
  SIM_REYNOLDS_02: [
    {
      prompt: "Même fluide, similitude de Reynolds au 1/N. La vitesse sur le modèle, comparée au prototype, est…",
      choices: [
        { id: "n", label: "N fois plus grande" },
        { id: "sqrt", label: "√N fois plus grande (comme Froude)" },
        { id: "same", label: "égale, pour que Re se ressemble « à l’œil »" }
      ],
      correct: "n",
      explain: "Re = VD/ν. Même ν ⇒ V_m = N V_p. Le petit modèle doit aller beaucoup plus vite, d’où des essais souvent irréalistes. Et F_p = F_m (même fluide, Re) : la force mesurée se transpose 1:1, pas en N³."
    }
  ],
  SIM_SPILL_03: [
    {
      prompt: "Pour l’évacuateur au 1/N (Froude), le débit du modèle, comparé à Q_prototype, est…",
      choices: [
        { id: "tiny", label: "beaucoup plus petit : Q_m = Q_p / N^{5/2}" },
        { id: "n2", label: "divisé seulement par N² (aires)" },
        { id: "same", label: "le même : on impose le débit de crue" }
      ],
      correct: "tiny",
      explain: "Q scale comme V L² donc √N × N² = N^{5/2}. Au 1/50, le modèle ne voit que Q_p/50^{2,5} ≈ Q_p/17678. On ne fait pas passer 250 m³/s dans le canal d’essai."
    }
  ],
  SIM_STOKES_04: [
    {
      prompt: "La formule de Stokes 3πμdV n’est licite que si…",
      choices: [
        { id: "re1", label: "Re de la bille est ≲ 1" },
        { id: "re2300", label: "Re < 2300, comme en conduite" },
        { id: "fast", label: "la bille tombe assez vite pour négliger Archimède" }
      ],
      correct: "re1",
      explain: "Stokes suppose un écoulement rampant autour de la sphère. Il faut vérifier Re = ρVd/μ après coup. Archimède, lui, se retranche toujours du poids : ce n’est pas un terme « rapide »."
    }
  ],
  CHANNEL_MANNING_01: [
    {
      prompt: "Si l’on raidi la pente du canal (S plus grande), à y constant, la vitesse de Manning…",
      choices: [
        { id: "up", label: "augmente, comme √S" },
        { id: "down", label: "diminue : plus de frottement sur le fond" },
        { id: "same", label: "ne change pas : seul Kₛ compte" }
      ],
      correct: "up",
      explain: "V = Kₛ R^{2/3} S^{1/2}. Doubler S multiplie V (et Q) par √2. Une pente plus forte, c’est plus de composante de pesanteur dans le sens de l’écoulement, pas plus de frottement dominant."
    }
  ],
  FS_TRAP_02: [
    {
      prompt: "Par rapport à un rectangle de même tirant y et même largeur au miroir, le trapèze de ce canal…",
      choices: [
        { id: "r", label: "a souvent un meilleur rayon hydraulique (talus qui « portent »)" },
        { id: "worse", label: "frotte forcément plus, le périmètre étant plus long" },
        { id: "fr1", label: "est toujours torrentiel, fruits ou non" }
      ],
      correct: "r",
      explain: "R = A/P. Les talus augmentent A plus vite que P par rapport à un rectangle étroit. D’où un R plus favorable et, à S et Kₛ égaux, un débit plus grand. Le régime (Fr) se calcule après, avec la profondeur moyenne A/T."
    }
  ],
  FS_NORMAL_03: [
    {
      prompt: "Pour un débit Q imposé dans ce collecteur, la profondeur normale yₙ est…",
      choices: [
        { id: "unique", label: "la hauteur unique qui fait Q_Manning(y) = Q" },
        { id: "crit", label: "toujours la profondeur critique" },
        { id: "full", label: "la hauteur de remplissage total du caniveau" }
      ],
      correct: "unique",
      explain: "En régime uniforme, la pente d’énergie égale S : une seule yₙ vérifie Manning pour (b, S, Kₛ, Q). y_c, elle, minimise l’énergie spécifique et n’a rien à voir avec le frottement. Il faut itérer yₙ, on ne la lit pas dans Q = AV avec V connu."
    }
  ],
  FS_WAVE_04: [
    {
      prompt: "Une petite intumescence peut remonter vers l’amont du canal seulement si…",
      choices: [
        { id: "sub", label: "l’écoulement est fluvial : V < c (Fr < 1)" },
        { id: "sup", label: "l’écoulement est torrentiel : V > c" },
        { id: "always", label: "toujours : le son dans l’eau va à 1400 m/s" }
      ],
      correct: "sub",
      explain: "La célérité relative est c = √(gy). Par rapport à la berge, le front amont avance à c − V. Si Fr > 1, c − V < 0 : l’information ne remonte pas. Ce n’est pas la célérité acoustique, c’est une onde de surface."
    }
  ],
  FS_RITTER_05: [
    {
      prompt: "Juste après la rupture, au droit du barrage (fond sec à l’aval), la hauteur d’eau vaut…",
      choices: [
        { id: "49", label: "4/9 de la retenue initiale h₀" },
        { id: "half", label: "h₀/2" },
        { id: "h0", label: "encore h₀, le front n’étant pas parti" }
      ],
      correct: "49",
      explain: "Ritter : le front aval part à 2√(gh₀), l’onde de dépression remonte à −√(gh₀), et sur le seuil h = 4h₀/9, V = 2√(gh₀)/3. Ce n’est ni la moitié, ni la retenue intacte."
    }
  ],
  SYN_GATE_01: [
    {
      prompt: "Avant d’ouvrir, l’effort pour décoller la vanne de chasse, comparé au seul poids W, …",
      choices: [
        { id: "more", label: "est plus grand : il faut aussi vaincre μF (frottement dû à la poussée)" },
        { id: "w", label: "égale W : on soulève une plaque sèche" },
        { id: "less", label: "est plus petit grâce à Archimède sur la vanne" }
      ],
      correct: "more",
      explain: "La poussée plaque la vanne contre ses glissières : le frottement μF s’ajoute au poids. T = W + μF au décollement. Une fois ouverte, le débit se calcule à part, comme un orifice sous la charge au centre, pas avec T."
    }
  ],
  SYN_NPSH_03: [
    {
      prompt: "Si l’on surélève l’axe de la pompe au-dessus de la bâche, le NPSH disponible…",
      choices: [
        { id: "down", label: "diminue : plus de dénivelé d’aspiration et souvent plus de pertes" },
        { id: "up", label: "augmente, la pompe « voit » plus d’atmosphère" },
        { id: "same", label: "ne change pas : NPSH ne dépend que du débit" }
      ],
      correct: "down",
      explain: "NPSH_d = (p_atm − p_v)/ρg − (z_e − z₀) − h_aspiration. Monter z_e grignote la marge avant cavitation. D’où une cote maximale d’installation, avec le NPSH requis constructeur et un coefficient de sécurité."
    }
  ],
  SYN_CANNON_04: [
    {
      prompt: "Le jet frappe l’écran perpendiculaire. Le recul sur la lance, comparé à la force sur l’écran, …",
      choices: [
        { id: "diff", label: "n’est pas le même bilan : tuyère (pA + ρQV) vs plaque (ρQV)" },
        { id: "eq", label: "lui est forcément égal (action / réaction)" },
        { id: "zero", label: "est nul, la lance débouchant à l’air libre" }
      ],
      correct: "diff",
      explain: "Sur l’écran, F = ρQV (vitesse axiale anéantie). Sur la lance, on ancre une tuyère : forces de pression amont et variation de quantité de mouvement. Le recul n’est donc pas « moins la force écran » : ce sont deux volumes de contrôle différents."
    }
  ],
  SYN_VENTURI_05: [
    {
      prompt: "Ce Venturi est vertical ascendant. Le débit déduit du manomètre au mercure, par rapport à un Venturi horizontal identique…",
      choices: [
        { id: "same", label: "est le même : le U lit une différence de charge piézométrique" },
        { id: "less", label: "est plus petit : il faut « payer » la montée" },
        { id: "more", label: "est plus grand, l’eau accélérant en montant" }
      ],
      correct: "same",
      explain: "Le manomètre différentiel mesure (p/ρg + z)_1 − (p/ρg + z)_2, déjà nettoyé de la dénivelée des prises. Bernoulli + continuité se ramènent alors à la même formule que le Venturi horizontal. On n’ajoute pas gΔz une seconde fois."
    }
  ],
  SYN_COFFER_06: [
    {
      prompt: "Pour poser le batardeau sur le fond, on le remplit d’eau de mer. Le but du ballast est…",
      choices: [
        { id: "w", label: "rendre le poids total supérieur à la poussée à immersion totale" },
        { id: "float", label: "le faire flotter plus haut pour passer les vagues" },
        { id: "gm", label: "uniquement d’abaisser G, sans changer le poids" }
      ],
      correct: "w",
      explain: "À vide il flotte (tirant d’eau < H). Pour s’asseoir, il faut W + W_ballast > ρg L B H, plus une réaction d’appui minimale. Le ballast augmente le poids ; la stabilité au remorquage, elle, se juge à vide avec GM."
    }
  ],
  SYN_OIL_07: [
    {
      prompt: "En hiver la viscosité du fioul double, le débit restant imposé. La puissance de pompage…",
      choices: [
        { id: "up", label: "augmente, surtout si l’on est laminaire ou en transition" },
        { id: "same", label: "reste la même : Q et D n’ont pas changé" },
        { id: "down", label: "diminue, l’huile « lubrifiant » mieux le tube" }
      ],
      correct: "up",
      explain: "μ × 2 fait chuter Re. En laminaire, h_f ∝ μ donc la puissance double presque. En turbulent rugueux, λ dépend peu de Re : l’écart été/hiver est plus faible. D’où l’intérêt de comparer les deux saisons avant de conclure."
    }
  ],
  EXAM_WALL_01: [
    {
      prompt: "Le coefficient de sécurité au renversement de ce mur-poids est le rapport…",
      choices: [
        { id: "stab", label: "moment stabilisant du poids / moment de la poussée, pris au pied aval" },
        { id: "f", label: "poids du mur / poussée horizontale" },
        { id: "h2", label: "H/3 divisé par l’épaisseur" }
      ],
      correct: "stab",
      explain: "On bascule autour de l’arête aval. Le poids (vertical) crée un moment résistant, la poussée (à H/3 du pied) un moment moteur. Le rapport des deux est le FS ; comparer seulement F et W oublie les bras de levier."
    }
  ],
  EXAM_NOZZLE_02: [
    {
      prompt: "La tuyère débouche à l’air libre. La vitesse du jet dépend surtout…",
      choices: [
        { id: "p", label: "de la pression amont (Bernoulli : V ≈ √(2p/ρ) si z constant)" },
        { id: "d1", label: "uniquement du gros diamètre D₁" },
        { id: "atm", label: "de la pression atmosphérique seule, p_amont ne comptant pas" }
      ],
      correct: "p",
      explain: "Entre l’amont et le veine (p = p_atm), Bernoulli convertit la charge de pression en V²/2g, corrigée de V₁ si la section amont n’est pas grande. D₁ sert au débit Q = V₂ A₂ et au bilan d’ancrage, pas à « créer » V₂ à lui seul."
    }
  ],
  EXAM_GRAVITY_03: [
    {
      prompt: "On ferme partiellement la vanne pour halver le débit. Le coefficient K de la vanne…",
      choices: [
        { id: "up", label: "doit augmenter fortement : plus de perte singulière pour le même H" },
        { id: "zero", label: "doit tendre vers 0 pour « laisser passer la moitié »" },
        { id: "lam", label: "n’a pas d’effet : seul λ(L/D) fixe Q" }
      ],
      correct: "up",
      explain: "H est fixé par les réservoirs. Q/2 ⇒ V/2 ⇒ les pertes linéaires chutent (~V²). Il faut donc un K_vanne beaucoup plus grand pour consommer le reliquat de charge. Une vanne plus ouverte, c’est K plus petit, donc Q plus grand."
    }
  ],
  TD_1_1: [
    {
      prompt: "Ces 6,5 m³ d’huile pèsent 55 kN. Un même volume d’eau pèserait environ 64 kN. L’huile est donc…",
      choices: [
        { id: "light", label: "plus légère que l’eau (densité < 1)" },
        { id: "heavy", label: "plus lourde que l’eau" },
        { id: "eq", label: "de même poids volumique, le kN étant une pression" }
      ],
      correct: "light",
      explain: "γ = W/𝒱 = 55/6,5 ≈ 8,5 kN/m³, contre 9,81 kN/m³ pour l’eau. D’où ρ ≈ 860 kg/m³ et d < 1. Le kN mesure ici un poids, pas une pression."
    }
  ],
  TD_1_2: [
    {
      prompt: "On passe de 1 bar à 250 bar. Le volume d’eau…",
      choices: [
        { id: "tiny", label: "ne diminue que d’environ 1 %" },
        { id: "half", label: "est à peu près divisé par 2" },
        { id: "zero", label: "est strictement invariable, l’eau étant incompressible" }
      ],
      correct: "tiny",
      explain: "|Δ𝒱|/𝒱 = Δp/K. Avec K ≈ 2,2 GPa et Δp = 249 bar ≈ 25 MPa, la compression relative est ≈ 1,1 %. Gros chiffre de pression, tout petit chiffre de volume : l’hypothèse d’incompressibilité reste raisonnable en GC."
    }
  ],
  TD_1_3: [
    {
      prompt: "Si l’on écarte les deux plaques (e plus grand) sans changer U ni μ, la force de traction…",
      choices: [
        { id: "down", label: "diminue" },
        { id: "up", label: "augmente" },
        { id: "same", label: "reste μUA, indépendante de e" }
      ],
      correct: "down",
      explain: "Profil linéaire : τ = μU/e, F = τA. Un jeu plus large abaisse le gradient, donc l’effort. C’est le même Couette que l’exercice 1.3, avec les 1,2 mm et 0,80 m² du TD."
    }
  ],
  TD_1_4: [
    {
      prompt: "Dans ce palier, si le jeu radial d’huile augmente, le couple résistant…",
      choices: [
        { id: "down", label: "diminue : le cisaillement μU/e faiblit" },
        { id: "up", label: "augmente, plus d’huile à cisailler" },
        { id: "n", label: "reste lié seulement à N, pas au jeu" }
      ],
      correct: "down",
      explain: "Le film du palier est un Couette cylindrique : τ = μωR/e. Un jeu plus grand lubrifie avec moins de frottement visqueux (tant que le régime hydrodynamique tient). Couple et puissance dissipée baissent ensemble."
    }
  ],
  TD_1_5: [
    {
      prompt: "Dans ce sol fin (pores ~ 0,05 mm), comparé à un tube de 5 mm, la montée capillaire est…",
      choices: [
        { id: "high", label: "beaucoup plus haute : h ∝ 1/d" },
        { id: "low", label: "plus faible, le sol « avalant » l’eau" },
        { id: "zero", label: "nulle : pas de tube de verre" }
      ],
      correct: "high",
      explain: "Jurin : h = 4σcosθ/(ρgd). Des pores dix fois plus fins montent dix fois plus haut. D’où des franges capillaires métriques dans les sables fins, alors qu’un piézomètre de 5 mm ne décale que de quelques millimètres."
    }
  ],
  TD_1_6: [
    {
      prompt: "Même pression, l’air à 35 °C, comparé à 0 °C, a une masse volumique…",
      choices: [
        { id: "less", label: "plus petite (gaz parfait : ρ ∝ 1/T)" },
        { id: "more", label: "plus grande, l’air chaud « pèse »" },
        { id: "same", label: "identique, R étant constant" }
      ],
      correct: "less",
      explain: "ρ = p/(RT) avec T en kelvin. 35 °C = 308 K contre 273 K : l’air chaud est plus léger. Ici s’ajoute une pression un peu plus basse (0,95 bar), qui diminue encore ρ₁ par rapport à ρ₂."
    }
  ],
  TD_2_1: [
    {
      prompt: "2,5 bar, c’est environ…",
      choices: [
        { id: "25", label: "25 m de colonne d’eau" },
        { id: "2.5", label: "2,5 m de colonne d’eau" },
        { id: "250", label: "250 m de colonne d’eau" }
      ],
      correct: "25",
      explain: "1 bar ≈ 10 mCE (plus précisément 10,2 m à 9,81 m/s²). Donc 2,5 bar ≈ 25 mCE. 740 mmHg, eux, sont un peu moins qu’une atmosphère (760 mmHg). Convertir d’abord en pascals évite de mélanger les échelles."
    }
  ],
  TD_2_2: [
    {
      prompt: "La pression relative à 28 m, c’est…",
      choices: [
        { id: "rgh", label: "ρgh, sans l’atmosphère" },
        { id: "abs", label: "ρgh + p_atm" },
        { id: "atm", label: "p_atm seule, l’eau étant à l’équilibre" }
      ],
      correct: "rgh",
      explain: "Relative = au-dessus de l’atmosphère = ρgh. Absolue = ρgh + p_atm. Un manomètre de plongée « à 2,8 bar » lit en général le relatif ; les tables de saturation, elles, parlent souvent d’absolu."
    }
  ],
  TD_2_3: [
    {
      prompt: "Le centre de la conduite est 0,40 m au-dessus du ménisque bas. Cette colonne d’eau, dans p au centre, …",
      choices: [
        { id: "sub", label: "se retranche : p = (ρ_Hg Δh − ρ z) g" },
        { id: "ignore", label: "se néglige devant 0,25 m de mercure" },
        { id: "double", label: "se compte deux fois, aller et retour dans le U" }
      ],
      correct: "sub",
      explain: "Du mercure ouvert à l’atmosphère on remonte jusqu’à l’axe : plus on est haut dans l’eau, plus la pression baisse. D’où p = (ρ_Hg Δh − ρz) g. Oublier les 0,40 m, c’est lire la pression trop bas. Le U ne « double » pas le mercure."
    }
  ],
  TD_2_4: [
    {
      prompt: "Le centre du disque est à 3,20 m. Le centre de poussée est…",
      choices: [
        { id: "deeper", label: "un peu plus profond que 3,20 m" },
        { id: "at", label: "exactement à 3,20 m" },
        { id: "half", label: "à 1,60 m, la moitié du diamètre" }
      ],
      correct: "deeper",
      explain: "Toujours y_p > ȳ sur une paroi verticale. L’écart I_G/(Aȳ) est modeste dès que ȳ ≫ D, mais il n’est pas zéro. Le centre géométrique n’est pas le point d’application de F."
    }
  ],
  TD_2_5: [
    {
      prompt: "Sur ce barrage-poids, la poussée d’eau (parement vertical) s’applique, depuis le pied, à…",
      choices: [
        { id: "h3", label: "H/3" },
        { id: "h2", label: "H/2" },
        { id: "h", label: "H, au plan d’eau" }
      ],
      correct: "h3",
      explain: "Diagramme triangulaire : la résultante passe au centre de gravité du triangle, à H/3 du pied (ou 2H/3 sous la surface). C’est ce bras qui entre dans le moment de renversement, pas H/2."
    }
  ],
  TD_2_6: [
    {
      prompt: "Ce tronc de densité 0,7 flotte. La fraction de volume immergée vaut…",
      choices: [
        { id: "s", label: "0,7 : Archimède égalise le poids" },
        { id: "half", label: "0,5, cylindre à demi-eau" },
        { id: "all", label: "1 : le bois finit toujours par couler" }
      ],
      correct: "s",
      explain: "W = ρ_bois g𝒱 = ρ_eau g𝒱_imm ⇒ 𝒱_imm/𝒱 = d. Ici 70 % du cylindre est sous l’eau, 30 % émerge. La masse se déduit ensuite de ρ_bois 𝒱, pas du volume immergé seul."
    }
  ],
  TD_2_7: [
    {
      prompt: "L’iceberg émerge d’une petite fraction parce que…",
      choices: [
        { id: "close", label: "ρ_glace est proche de ρ_mer, donc 𝒱_imm/𝒱 ≈ 0,9" },
        { id: "air", label: "la glace est pleine d’air : presque tout émerge" },
        { id: "salt", label: "le sel fait couler la partie immergée seulement" }
      ],
      correct: "close",
      explain: "𝒱_imm/𝒱 = ρ_glace/ρ_mer ≈ 917/1025 ≈ 0,89. Il n’émerge donc qu’≈ 11 %. « La partie visible » est trompeuse : presque tout le volume est sous l’eau."
    }
  ],
  TD_2_8: [
    {
      prompt: "Pour cette barge, élargir B (à tirant d’eau égal) rend en général GM…",
      choices: [
        { id: "up", label: "plus grand : I (et donc BM) croît comme B³" },
        { id: "down", label: "plus petit, G étant plus haut sur une barge large" },
        { id: "b", label: "inchangé : seul le tirant d’eau compte" }
      ],
      correct: "up",
      explain: "BM = I/∇ avec I = LB³/12 au roulis. Un peu plus de largeur augmente beaucoup la stabilité initiale. G trop haut peut encore tuer GM, mais à z_G fixé, B est le levier principal."
    }
  ],
  TD_3_1: [
    {
      prompt: "68 L/s dans 250 mm, pour viser 1,0 m/s, il faut un diamètre…",
      choices: [
        { id: "bigger", label: "plus grand que 250 mm (V actuelle > 1 m/s)" },
        { id: "smaller", label: "plus petit, pour « accélérer » jusqu’à 1 m/s" },
        { id: "same", label: "identique : Q fixe V" }
      ],
      correct: "bigger",
      explain: "V = Q/A. Si V actuelle dépasse la cible, on manque de section : on grossit D. Un tube plus petit irait encore plus vite, l’inverse du but d’un réseau d’adduction."
    }
  ],
  TD_3_2: [
    {
      prompt: "Le débit du canal rectangulaire se calcule par…",
      choices: [
        { id: "by", label: "Q = b y V (section mouillée × vitesse moyenne)" },
        { id: "manning", label: "Manning, même sans pente ni Kₛ dans l’énoncé" },
        { id: "sqrt", label: "Q = b √(2gy), comme un déversoir" }
      ],
      correct: "by",
      explain: "Ici V est donnée : cinématique pure, Q = AV. Manning servirait à trouver V à partir de S et Kₛ, données absentes du TD 3.2. Penser à convertir aussi en m³/h (× 3600)."
    }
  ],
  TD_3_3: [
    {
      prompt: "Un champ 2D est incompressible si…",
      choices: [
        { id: "div", label: "div V⃗ = ∂u/∂x + ∂v/∂y = 0 partout" },
        { id: "rot", label: "le rotationnel est nul" },
        { id: "k", label: "la constante k est positive" }
      ],
      correct: "div",
      explain: "Continuité 2D incompressible : ∂u/∂x + ∂v/∂y = 0. Ici u = kx², v = −2kxy donne bien 2kx − 2kx = 0. L’irrotationnalité (ω_z = 0) est une autre question : ce champ-là n’est en général pas irrotationnel."
    }
  ],
  TD_3_4: [
    {
      prompt: "Vitesse de 4 à 24 m/s sur 0,80 m, linéairement. Au milieu, l’eau…",
      choices: [
        { id: "acc", label: "accélère (terme V dV/dx), même en régime permanent" },
        { id: "a0", label: "n’accélère pas : le profil ne dépend pas du temps" },
        { id: "dec", label: "ralentit, 24 m/s étant trop grand" }
      ],
      correct: "acc",
      explain: "dV/dx = (24−4)/0,80 > 0 et V_milieu = 14 m/s, donc a = V dV/dx ≈ 350 m/s². Une tuyère permanente accélère bel et bien les particules. Ce n’est pas ∂V/∂t."
    }
  ],
  TD_3_5: [
    {
      prompt: "400 m³ en 6 h avec V ≤ 1,5 m/s : le diamètre retenu est le…",
      choices: [
        { id: "min", label: "minimum tel que A ≥ Q/V_max" },
        { id: "max", label: "maximum commercial, pour aller le plus vite" },
        { id: "v", label: "celui qui impose V = 0, le réservoir se remplissant seul" }
      ],
      correct: "min",
      explain: "Q = 𝒱/t est fixé, V_max aussi, d’où D_min. Un tube plus gros marcherait (V plus faible) mais coûte plus. Plus petit, on dépasserait 1,5 m/s. On dimensionne au plus juste hydraulique."
    }
  ],
  TD_4_1: [
    {
      prompt: "Conduite horizontale, D divisé par 2. La pression aval, fluide parfait…",
      choices: [
        { id: "down", label: "baisse, la vitesse étant quadruplée" },
        { id: "same", label: "reste p₁, z étant constant" },
        { id: "up", label: "monte, l’eau étant chassée dans un petit tube" }
      ],
      correct: "down",
      explain: "A₂ = A₁/4 ⇒ V₂ = 4V₁. Bernoulli horizontal : Δ(V²/2g) se paie en pression. p₂ < p₁, parfois de beaucoup. Ce n’est pas un manomètre de niveau, c’est de l’énergie cinétique."
    }
  ],
  TD_4_2: [
    {
      prompt: "Orifice en mince paroi, Cᵈ ≈ 0,62. Par rapport à Torricelli idéal (Cᵈ = 1), le débit réel est…",
      choices: [
        { id: "less", label: "plus petit d’environ 40 %" },
        { id: "more", label: "plus grand, la veine se contractant" },
        { id: "eq", label: "égal : Cᵈ ne corrige que la vitesse, pas Q" }
      ],
      correct: "less",
      explain: "Cᵈ englobe contraction (C_c) et pertes. Q = Cᵈ A √(2gh) ≈ 0,62 Q_idéal. La veine est plus étroite que le trou, d’où moins de débit, pas plus."
    }
  ],
  TD_4_3: [
    {
      prompt: "Pitot en rivière, 95 mm d’eau. L’ordre de grandeur de V est…",
      choices: [
        { id: "1", label: "autour de 1,4 m/s (√(2gh))" },
        { id: "10", label: "autour de 10 m/s" },
        { id: "95", label: "95 m/s, h étant en mm" }
      ],
      correct: "1",
      explain: "V = √(2gh) avec h = 0,095 m ⇒ √(1,86) ≈ 1,4 m/s, vitesse de rivière crédible. Oublier de passer les mm en mètres explose le résultat. Ici le fluide manométrique est l’eau, pas le mercure."
    }
  ],
  TD_4_4: [
    {
      prompt: "Au col 125 mm d’un Venturi 250/125, la vitesse, comparée à l’entrée, est…",
      choices: [
        { id: "x4", label: "quatre fois plus grande (aires en D²)" },
        { id: "x2", label: "deux fois plus grande (rapport des diamètres)" },
        { id: "same", label: "la même, débitmétrie oblige" }
      ],
      correct: "x4",
      explain: "D₂ = D₁/2 ⇒ A₂ = A₁/4 ⇒ V₂ = 4V₁. C’est ce saut de V² qui crée p₁ − p₂, donc le débit. Un rapport 2 sur D n’est pas un rapport 2 sur V."
    }
  ],
  TD_4_5: [
    {
      prompt: "Le débit du siphon est fixé par…",
      choices: [
        { id: "drop", label: "la dénivellation de sortie (2,20 m), pas la bosse de 1,10 m" },
        { id: "rise", label: "uniquement la hauteur du point haut" },
        { id: "d", label: "le diamètre seul, V étant 1 m/s par défaut" }
      ],
      correct: "drop",
      explain: "Surface libre → sortie à l’air libre : V = √(2gΔz_sortie) en parfait. La bosse fixe la dépression (cavitation), pas Q. Un siphon plus « haut » n’aspire pas plus fort s’il débouche au même niveau."
    }
  ],
  TD_4_6: [
    {
      prompt: "Si le rendement de la turbine passe de 88 % à 100 %, la puissance électrique…",
      choices: [
        { id: "up", label: "augmente : P = η ρgQH" },
        { id: "same", label: "reste ρgQH, η ne concernant que les pompes" },
        { id: "down", label: "diminue, moins de « pertes utiles »" }
      ],
      correct: "up",
      explain: "La puissance hydraulique brute est ρgQH ; l’alternateur n’en voit qu’une fraction η. η = 1 serait le plafond idéal. Ici 88 % retranche déjà 12 % : ce n’est pas négligeable sur un 2,4 m³/s × 38 m."
    }
  ],
  TD_4_7: [
    {
      prompt: "Le niveau descend de 3,60 m à 0,90 m. Le temps de vidange, comparé à une vidange à vitesse constante √(2gh₁), est…",
      choices: [
        { id: "longer", label: "plus long : le débit faiblit avec √h" },
        { id: "equal", label: "le même, h moyen suffisant" },
        { id: "half", label: "deux fois plus court, 0,90 = 3,60/4" }
      ],
      correct: "longer",
      explain: "t ∝ (√h₁ − √h₂). Les derniers 90 cm sont lents. Prendre V(h₁) tout du long sous-estime t. Le rapport des charges 4 n’implique pas un rapport de temps 1/2."
    }
  ],
  TD_5_1: [
    {
      prompt: "Jet 20 m/s, 50 mm, mur normal. Si l’on ne gardait que 10 m/s, F serait…",
      choices: [
        { id: "quarter", label: "divisée par 4 (F ∝ V²)" },
        { id: "half", label: "divisée par 2" },
        { id: "same", label: "inchangée, le diamètre restant 50 mm" }
      ],
      correct: "quarter",
      explain: "F = ρAV² sur plaque qui arrête le jet. Moitié de V, quart de force. Le 20 m/s du TD n’est pas un détail : c’est le facteur dominant."
    }
  ],
  TD_5_2: [
    {
      prompt: "Même jet qu’en 5.1, mais auget à 135°. La force, comparée au mur normal, est…",
      choices: [
        { id: "bigger", label: "plus grande (on inverse une partie de V_x)" },
        { id: "smaller", label: "plus petite, l’eau « glissant » sur l’auget" },
        { id: "eq", label: "égale : même Q, même V" }
      ],
      correct: "bigger",
      explain: "ΔV_x = V(1 − cosθ). À 135°, 1 − cos135° = 1 + √2/2 ≈ 1,71 > 1. L’auget pousse plus que le mur. À 180° on irait jusqu’à 2."
    }
  ],
  TD_5_3: [
    {
      prompt: "Coude 45°, D constant, 300 kPa. La force d’ancrage vient surtout…",
      choices: [
        { id: "p", label: "des forces de pression pA, le terme ρQV étant plus modeste" },
        { id: "mom", label: "uniquement de ρQΔV, p ne jouant pas en relatif" },
        { id: "w", label: "du poids d’eau dans le coude" }
      ],
      correct: "p",
      explain: "pA ≈ 300 kPa × πD²/4 est énorme devant ρQV dès que D = 400 mm. Le 45° oriente la résultante, mais oublier pA sous-estime l’ancrage d’un facteur souvent > 10. Le poids est hors plan horizontal."
    }
  ],
  TD_5_4: [
    {
      prompt: "Le chariot éjecte 15 L/s à 12 m/s. La force pour le retenir vaut…",
      choices: [
        { id: "rhoqv", label: "ρQV, réaction du jet" },
        { id: "mg", label: "le poids du réservoir" },
        { id: "zero", label: "0 en régime permanent" }
      ],
      correct: "rhoqv",
      explain: "Quantité de mouvement sortante : F = ρQV ≈ 180 N. Permanent ne veut pas dire force nulle : le fluide emporte de la quantité de mouvement, le chariot doit la fournir. Le poids est vertical."
    }
  ],
  TD_5_5: [
    {
      prompt: "L’auget mobile à u = 8 m/s sous un jet à 25 m/s, comparé à l’auget fixe…",
      choices: [
        { id: "less", label: "reçoit une force plus faible, mais fournit une puissance Fu" },
        { id: "more", label: "est plus chargé, d’où plus de puissance" },
        { id: "p0", label: "n’a aucune puissance, u étant < V" }
      ],
      correct: "less",
      explain: "Vitesse relative V − u. F baisse par rapport au fixe, mais P = Fu devient non nulle. Si u = 0, P = 0 ; si u = V, F = 0. Le TD demande les deux : force et puissance."
    }
  ],
  TD_6_1: [
    {
      prompt: "Eau à 0,10 m/s dans 20 mm : Re est de l’ordre de…",
      choices: [
        { id: "2000", label: "2 000, donc proche de la transition / laminaire" },
        { id: "1e6", label: "un million, forcément turbulent" },
        { id: "1", label: "1, comme Stokes" }
      ],
      correct: "2000",
      explain: "Re = VD/ν = 0,10 × 0,020 / 10⁻⁶ = 2000. Cas pédagogique limite. L’huile du b), malgré 1,2 m/s et 100 mm, a ν × 400 : Re plus petit, souvent laminaire. Toujours calculer, ne pas « voir » le régime."
    }
  ],
  TD_6_2: [
    {
      prompt: "Cette huile en 40 mm sur 150 m. Si le débit est laminaire, h_f est proportionnelle…",
      choices: [
        { id: "q", label: "à Q (et à μ), pas à Q²" },
        { id: "q2", label: "à Q², comme Darcy turbulent" },
        { id: "l0", label: "indépendante de L" }
      ],
      correct: "q",
      explain: "Poiseuille : Δp = 32μLV/D² donc h_f ∝ μLQ/D⁴. Doubler Q double h_f, alors qu’en turbulent on irait vers Q². Vérifier Re avant de coller Moody."
    }
  ],
  TD_6_3: [
    {
      prompt: "Eau, conduite rugueuse, Q donné. Le λ à lire sur Moody dépend surtout de…",
      choices: [
        { id: "both", label: "Re et de ε/D, via Colebrook" },
        { id: "reonly", label: "Re seulement (formule 64/Re)" },
        { id: "q", label: "Q tout seul, D étant secondaire" }
      ],
      correct: "both",
      explain: "On calcule V puis Re = VD/ν et ε/D, puis on itère Colebrook (ou on lit Moody). 64/Re serait du laminaire, rarement de l’eau en 200 mm. ε n’est pas décoratif."
    }
  ],
  TD_6_4: [
    {
      prompt: "Vanne de K = 2 sur 150 mm à 30 L/s. Si l’on ouvrait jusqu’à K ≈ 0,2, h_s…",
      choices: [
        { id: "down", label: "serait divisée par 10 (h_s = K V²/2g, V inchangée si Q l’est)" },
        { id: "up", label: "augmenterait, vanne plus ouverte" },
        { id: "v", label: "changerait via V seulement, K étant un angle" }
      ],
      correct: "down",
      explain: "À Q imposé, V est fixé par D. h_s suit K. Une vanne ouverte a un petit K ; fermée, K s’envole et peut dominer les pertes linéaires. Ici les autres K du solveur sont à 0 : on isole la vanne."
    }
  ],
  TD_6_5: [
    {
      prompt: "12 m de dénivelée sur 600 m de 125 mm. Le débit n’est pas √(2gH) × A parce que…",
      choices: [
        { id: "f", label: "presque toute H est consommée par λL/D et ΣK, pas par V²/2g « utile »" },
        { id: "orif", label: "il manque un coefficient Cᵈ d’orifice" },
        { id: "vac", label: "le vide d’air dans la conduite bloque Q" }
      ],
      correct: "f",
      explain: "C’est un problème de débitance : H = (λL/D + ΣK) V²/2g. √(2gH) serait un orifice sans tube. Ici le frottement sur 600 m bride fortement V, d’où un Q à itérer avec Colebrook."
    }
  ],
  TD_6_6: [
    {
      prompt: "H_g = 26 m et 14 m de pertes. La HMT vaut…",
      choices: [
        { id: "40", label: "40 m : on additionne géométrie et pertes" },
        { id: "26", label: "26 m, les pertes étant déjà « dans » le réseau" },
        { id: "12", label: "12 m : on retranche les pertes de la géométrie" }
      ],
      correct: "40",
      explain: "HMT = H_g + Σh = 26 + 14 = 40 m. La pompe fournit les deux. P_abs = ρgQ HMT / η : oublier les 14 m sous-estime la puissance de 35 %."
    }
  ],
  TD_6_7: [
    {
      prompt: "Élargissement 80 → 160 mm. La perte de Borda, comparée à un élargissement plus doux, est…",
      choices: [
        { id: "big", label: "plus grande : (V₁ − V₂)²/2g est maximal pour un saut brusque" },
        { id: "zero", label: "nulle, Bernoulli parfait s’appliquant encore" },
        { id: "hf", label: "égale à λL/D du petit tube" }
      ],
      correct: "big",
      explain: "Borda–Carnot quantifie le décollement d’un élargissement brusque. Un divergent progressif réduit cette perte (pas à zéro). Ici D × 2 ⇒ V₂ = V₁/4, donc (V₁ − V₂) reste proche de V₁."
    }
  ],
  TD_7_1: [
    {
      prompt: "La puissance a pour dimensions…",
      choices: [
        { id: "ml2t3", label: "M L² T⁻³" },
        { id: "mlt2", label: "M L T⁻² (une force)" },
        { id: "l3t", label: "L³ T⁻¹ (un débit)" }
      ],
      correct: "ml2t3",
      explain: "P = F V = (M L T⁻²)(L T⁻¹) = M L² T⁻³. Le couple est M L² T⁻² (une énergie), la contrainte M L⁻¹ T⁻². Coller les exposants évite de mélanger watts, newtons et m³/s."
    }
  ],
  TD_7_2: [
    {
      prompt: "Période d’un pendule T = k Lᵃ gᵇ mᶜ. L’exposant de la masse m est…",
      choices: [
        { id: "zero", label: "0 : m n’intervient pas" },
        { id: "half", label: "1/2, comme √(m/k) d’un ressort" },
        { id: "one", label: "1, T proportionnelle à m" }
      ],
      correct: "zero",
      explain: "Il n’y a que T, L, g, m. Le théorème des π impose a = 1/2, b = −1/2, c = 0 : T ∝ √(L/g). La masse s’élimine, comme dans le cours de pendule simple. Ce n’est pas un oscillateur masse-ressort."
    }
  ],
  TD_7_3: [
    {
      prompt: "Puissance d’hélice P ~ ρᵃ nᵇ Dᶜ. P est homogène à une force × une vitesse, donc…",
      choices: [
        { id: "rho", label: "a = 1 : P ∝ ρ n³ D⁵ (formule classique)" },
        { id: "a0", label: "a = 0 : l’air n’entre pas, seulement n et D" },
        { id: "n1", label: "b = 1 : P proportionnelle au régime" }
      ],
      correct: "rho",
      explain: "Une seule combinaison sans dimension relie P, ρ, n, D : P/(ρ n³ D⁵) = const. Donc a = 1, b = 3, c = 5. Doubler le régime (n) multiplie P par 8, pas par 2."
    }
  ],
  TD_7_4: [
    {
      prompt: "Déversoir au 1/40, Froude. Le débit modèle, pour 950 m³/s en vrai, est…",
      choices: [
        { id: "tiny", label: "très petit : Q_m = Q_p / 40^{5/2}" },
        { id: "40", label: "950/40 m³/s" },
        { id: "same", label: "950 m³/s, on reproduisant la crue" }
      ],
      correct: "tiny",
      explain: "λ_Q = N^{5/2} = 40^{2,5} ≈ 10119. Le modèle ne voit qu’environ 94 L/s, pas 24 m³/s ni 950. Les aires N² ne suffisent pas : les vitesses scalent encore en √N."
    }
  ],
  TD_7_5: [
    {
      prompt: "Froude au 1/25, même fluide. La force réelle, comparée aux 46 N du modèle, est…",
      choices: [
        { id: "n3", label: "beaucoup plus grande : F ∝ ρ L³ (ici × 25³)" },
        { id: "n", label: "× 25 seulement" },
        { id: "same", label: "46 N, comme en Reynolds même fluide" }
      ],
      correct: "n3",
      explain: "En Froude, ρ_p = ρ_m ⇒ F_p/F_m = N³. 25³ = 15625, donc des centaines de kN en vrai. La période, elle, scale en √N : 1,6 s × 5 = 8 s. Ne pas coller l’échelle des forces de Reynolds."
    }
  ],
  TD_7_6: [
    {
      prompt: "Conduite au 1/10, même fluide, Reynolds. 15 m/s sur le modèle représentent en vrai…",
      choices: [
        { id: "slow", label: "1,5 m/s seulement (V_p = V_m / N)" },
        { id: "fast", label: "150 m/s (V_p = N V_m)" },
        { id: "sqrt", label: "15√10 m/s, comme Froude" }
      ],
      correct: "slow",
      explain: "Re identique, ν identique ⇒ V L constant, donc V_p = V_m × (L_m/L_p) = 15/10 = 1,5 m/s. Le modèle va plus vite que le prototype, l’inverse de Froude. 15 m/s en vrai serait un autre Re."
    }
  ],
  COMP_FUEL_01: [
    {
      prompt: "Ce fioul de chantier, plus léger que l’eau, a une densité…",
      choices: [
        { id: "lt", label: "inférieure à 1" },
        { id: "eq", label: "égale à 1" },
        { id: "gt", label: "supérieure à 1" }
      ],
      correct: "lt",
      explain: "La densité est ρ/ρeau. Un fioul qui surnagerait a ρ < 1000 kg/m³, donc d < 1. Le poids volumique γ = ρg est alors plus petit que 9,81 kN/m³."
    }
  ],
  COMP_QUARRY_01: [
    {
      prompt: "À 15 m d’eau douce, la pression relative vaut environ…",
      choices: [
        { id: "15", label: "1,5 bar (règle 10 m ≈ 1 bar)" },
        { id: "1", label: "1 bar, comme à la surface" },
        { id: "15b", label: "15 bar" }
      ],
      correct: "15",
      explain: "Relative = ρgh. 10 m d’eau ≈ 1 bar, donc 15 m ≈ 1,5 bar (1,5×10⁵ Pa). L’absolue ajoute encore l’atmosphère : ≈ 2,5 bar abs. Ce n’est pas 15 bar."
    }
  ],
  COMP_SETTLER_01: [
    {
      prompt: "Au fond du décanteur, la pression, comparée à celle sous 1,5 m + 2,4 m d’eau seule…",
      choices: [
        { id: "less", label: "est plus faible : l’huile pèse moins que l’eau" },
        { id: "more", label: "est plus forte, deux couches s’additionnant toujours plus" },
        { id: "oil", label: "égale seulement ρ_huile g (1,5+2,4)" }
      ],
      correct: "less",
      explain: "On additionne ρg h de chaque couche. L’huile (810 kg/m³) contribue moins que la même hauteur d’eau. Le fond « sent » 1,5 m d’huile + 2,4 m d’eau, pas 3,9 m d’eau."
    }
  ],
  COMP_SLUICE_01: [
    {
      prompt: "Cette vanne est entièrement sous le plan d’eau. Le centre de poussée, par rapport au centre géométrique, est…",
      choices: [
        { id: "deeper", label: "un peu plus bas" },
        { id: "at", label: "confondu avec le centre de la vanne" },
        { id: "up", label: "plus haut, vers la surface" }
      ],
      correct: "deeper",
      explain: "La pression croît avec la profondeur : y_p = ȳ + I_G/(Aȳ) > ȳ. Plus y₀ est grand, plus l’écart diminue, mais il ne s’annule pas."
    }
  ],
  COMP_LOCK_01: [
    {
      prompt: "Sur cette paroi de sas, le diagramme des pressions est un triangle. La résultante passe…",
      choices: [
        { id: "h3", label: "à H/3 au-dessus du radier" },
        { id: "h2", label: "à mi-hauteur" },
        { id: "top", label: "au niveau du plan d’eau" }
      ],
      correct: "h3",
      explain: "Triangle de pression : le centre de gravité est à H/3 du pied (2H/3 sous la surface). C’est ce bras qui entre dans le moment de renversement, pas H/2."
    }
  ],
  COMP_PIPE_01: [
    {
      prompt: "À débit constant, si le diamètre actuel est trop petit pour la vitesse cible, il faut…",
      choices: [
        { id: "up", label: "un DN plus grand (V = Q/A)" },
        { id: "down", label: "un DN plus petit pour « calmer » l’eau" },
        { id: "q", label: "changer Q, le diamètre ne jouant pas" }
      ],
      correct: "up",
      explain: "V = Q/A et A ∝ D². Pour baisser V sans changer Q, on augmente D. Un tube plus étroit irait encore plus vite, l’inverse d’une adduction de lotissement."
    }
  ],
  COMP_REDUCER_01: [
    {
      prompt: "D₂ = D₁/2, régime permanent. Le débit dans le petit tube…",
      choices: [
        { id: "same", label: "est le même : Q = A₁V₁ = A₂V₂" },
        { id: "half", label: "est divisé par 2" },
        { id: "x4", label: "est divisé par 4" }
      ],
      correct: "same",
      explain: "L’eau incompressible ne s’accumule pas dans le réducteur. L’aire chute d’un facteur 4, donc V₂ = 4V₁, mais Q ne change pas. C’est le contrôle à écrire en premier."
    }
  ],
  COMP_VENTURI_01: [
    {
      prompt: "Au col du Venturi, la section diminue. La pression, comparée à l’entrée…",
      choices: [
        { id: "down", label: "baisse (V augmente, Bernoulli)" },
        { id: "up", label: "monte, l’eau étant « coincée »" },
        { id: "same", label: "reste égale, conduite horizontale" }
      ],
      correct: "down",
      explain: "V₂ > V₁. Horizontalement, p/ρg + V²/2g se conserve : si V² augmente, p diminue. C’est cette dépression que le mercure mesure et qui donne Q."
    }
  ],
  COMP_ORIFICE_01: [
    {
      prompt: "Si l’on double le diamètre de l’orifice, la charge restant 3,2 m, la vitesse de sortie…",
      choices: [
        { id: "same", label: "reste essentiellement la même (√(2gh))" },
        { id: "x2", label: "double" },
        { id: "x4", label: "est multipliée par 4" }
      ],
      correct: "same",
      explain: "Torricelli : V = Cᵈ √(2gh) dépend de la charge, pas de d. Le débit, lui, suit l’aire : Q × 4. Un trou plus gros évacue plus, sans tirer plus vite."
    }
  ],
  COMP_SIPHON_01: [
    {
      prompt: "Le débit de ce trop-plein est fixé par…",
      choices: [
        { id: "drop", label: "la dénivellation de sortie Δz, pas la bosse z_C" },
        { id: "rise", label: "uniquement la hauteur du point haut" },
        { id: "d", label: "le diamètre seul, V valant 1 m/s" }
      ],
      correct: "drop",
      explain: "Surface libre → sortie à l’air : V = √(2gΔz) en parfait. La bosse fixe la dépression (cavitation), pas Q. Un siphon plus haut n’évacue pas davantage s’il débouche au même niveau."
    }
  ],
  COMP_HOSE_01: [
    {
      prompt: "Si la vitesse du jet d’incendie double (même lance), la force sur le coffrage…",
      choices: [
        { id: "x4", label: "est multipliée par 4 (F = ρAV²)" },
        { id: "x2", label: "est multipliée par 2" },
        { id: "same", label: "ne change pas, le panneau arrêtant toujours le jet" }
      ],
      correct: "x4",
      explain: "F = ρQV et Q = AV, donc F = ρAV². Doubler V double le débit et quadruple l’effort. Un jet plus rapide charge beaucoup plus le coffrage."
    }
  ],
  COMP_CASTIRON_01: [
    {
      prompt: "À débit presque constant, si cette fonte est deux fois plus longue, h_f…",
      choices: [
        { id: "x2", label: "est à peu près doublée" },
        { id: "x4", label: "est multipliée par 4" },
        { id: "same", label: "ne dépend que de ε, pas de L" }
      ],
      correct: "x2",
      explain: "Darcy : h_f = λ(L/D)V²/2g. λ varie peu si Re et ε/D sont inchangés. Donc h_f ∝ L. La rugosité de la fonte pèse sur λ, la longueur sur le facteur L/D."
    }
  ],
  COMP_DITCH_01: [
    {
      prompt: "Si l’on raidi la pente du fossé (S plus grande) à y constant, la vitesse de Manning…",
      choices: [
        { id: "up", label: "augmente comme √S" },
        { id: "down", label: "diminue : plus de frottement sur le fond" },
        { id: "ks", label: "ne change pas : seul Kₛ compte" }
      ],
      correct: "up",
      explain: "V = Kₛ R^{2/3} S^{1/2}. Doubler S multiplie V (et Q) par √2. Une pente plus forte, c’est plus de pesanteur dans le sens de l’écoulement, pas un frein."
    }
  ],
  COMP_TWOFLUID_01: [
    {
      prompt: "Même palier, l’eau (μ beaucoup plus petite) comparée à l’huile : l’effort de traction…",
      choices: [
        { id: "mu", label: "est plus petit, dans le rapport des viscosités" },
        { id: "rho", label: "est plus grand, l’eau étant plus dense" },
        { id: "same", label: "est le même : U et e n’ont pas changé" }
      ],
      correct: "mu",
      explain: "τ = μ U/e. ρ n’entre pas dans la loi de Newton. L’eau, très peu visqueuse, « accroche » beaucoup moins. ν = μ/ρ servirait à un Reynolds du film, pas à F."
    }
  ],
  COMP_VISCTEMP_01: [
    {
      prompt: "On passe d’une huile froide à une huile plus chaude. L’effort de traction du film…",
      choices: [
        { id: "down", label: "diminue, μ baissant avec T" },
        { id: "up", label: "augmente : l’huile « s’agite » plus" },
        { id: "rho", label: "suit ρ, pas μ" }
      ],
      correct: "down",
      explain: "Pour un liquide, μ diminue quand T augmente. τ = μ U/e suit μ. Interpoler entre deux points de tableau donne μ(T) de chantier, puis F."
    }
  ],
  COMP_DUALGATE_01: [
    {
      prompt: "Si les deux plans d’eau sont au même niveau, l’effort net sur la vanne…",
      choices: [
        { id: "zero", label: "s’annule : les poussées se compensent" },
        { id: "twice", label: "double, deux faces mouillées" },
        { id: "up", label: "reste la poussée amont seule" }
      ],
      correct: "zero",
      explain: "F = ρg A (y₁ − y₂). y₁ = y₂ ⇒ F = 0. Oublier l’aval, c’est dimensionner un treuil pour une vanne qui n’a presque rien à retenir."
    }
  ],
  COMP_LOCKDOOR_01: [
    {
      prompt: "Sur cette porte d’écluse, les diagrammes de pression sont des triangles depuis le radier. La résultante amont s’applique…",
      choices: [
        { id: "h3", label: "à H/3 au-dessus du radier" },
        { id: "h2", label: "à mi-hauteur H/2" },
        { id: "yc", label: "à H/2 sous la surface, comme une vanne noyée" }
      ],
      correct: "h3",
      explain: "Paroi affleurante : triangle de 0 en surface à ρgH au radier. Le centre de gravité du triangle est à H/3 du bas. Ce n’est pas une vanne entièrement immergée (ȳ = H/2)."
    }
  ],
  COMP_HGL_01: [
    {
      prompt: "Le long d’une conduite de diamètre constant, la ligne de charge (EGL) se situe par rapport à la piézométrique (HGL)…",
      choices: [
        { id: "above", label: "V²/2g au-dessus, et les deux restent parallèles hors singularités" },
        { id: "below", label: "en dessous, la pression « poussant » plus que la vitesse" },
        { id: "cross", label: "elles se croisent à chaque coude" }
      ],
      correct: "above",
      explain: "EGL = HGL + V²/2g. D constant ⇒ V constant ⇒ écart constant : droites parallèles, inclinées par Darcy. Un K fait un cran identique sur les deux."
    }
  ],
  COMP_ECON_01: [
    {
      prompt: "À débit imposé, passer à un DN plus grand…",
      choices: [
        { id: "hf", label: "fait chuter fortement h_f, mais augmente le terme αD" },
        { id: "morehf", label: "augmente h_f : plus de paroi à frotter" },
        { id: "c", label: "laisse C inchangé, α et β se compensant toujours" }
      ],
      correct: "hf",
      explain: "V ∝ 1/D² donc h_f ∝ 1/D⁵ environ. Le gros tube gagne sur β h_f et perd sur αD. C minimal n’est ni le plus petit ni le plus grand DN a priori."
    }
  ],
  COMP_PUMPCURVE_01: [
    {
      prompt: "Le débit réel n’est ni Q = 0 ni le Q « catalogue » : c’est…",
      choices: [
        { id: "cut", label: "l’intersection de H_pompe(Q) et H_réseau(Q)" },
        { id: "max", label: "le débit qui maximise H₀" },
        { id: "geo", label: "celui de Torricelli sur H_g" }
      ],
      correct: "cut",
      explain: "La pompe fournit moins de H quand Q croît ; le réseau en demande plus (pertes ~ Q²). Là où les deux courbes se coupent, H et Q sont compatibles. H_g seul ignorerait les pertes."
    }
  ],
  COMP_WEIR_01: [
    {
      prompt: "Si la charge sur le seuil double, le débit…",
      choices: [
        { id: "28", label: "est multiplié par 2√2 ≈ 2,8 (Q ∝ h^{3/2})" },
        { id: "x2", label: "double, comme un orifice" },
        { id: "x4", label: "est multiplié par 4" }
      ],
      correct: "28",
      explain: "La lame se calcule en intégrant √(2gz) sur la hauteur h : on trouve h^{3/2}. Ce n’est pas Torricelli d’un trou unique (∝ √h) ni une section qui double."
    }
  ],
  COMP_JUMP_01: [
    {
      prompt: "Un ressaut classique n’existe que si l’amont est…",
      choices: [
        { id: "sup", label: "torrentiel : Fr₁ > 1" },
        { id: "sub", label: "fluvial : Fr₁ < 1" },
        { id: "any", label: "indifférent : y₂ suit toujours 2 y₁" }
      ],
      correct: "sup",
      explain: "Le ressaut raccorde un torrentiel à un fluvial. Si Fr₁ < 1, la formule de conjugaison ne décrit pas un ressaut. y₂/y₁ n’est pas un facteur 2 universel : il dépend de Fr₁."
    }
  ],
  COMP_FROUDE_01: [
    {
      prompt: "Dans ce canal, si y est plus grand que y_c, l’écoulement est…",
      choices: [
        { id: "sub", label: "fluvial : Fr < 1, commandé par l’aval" },
        { id: "sup", label: "torrentiel : Fr > 1" },
        { id: "crit", label: "toujours critique, Q étant fixé" }
      ],
      correct: "sub",
      explain: "y_c minimise l’énergie spécifique à Q donné. Au-dessus, Fr < 1 : une perturbation remonte. Ce n’est pas le Q qui « impose » le critique, c’est le couple (Q, y, b)."
    }
  ]
};
