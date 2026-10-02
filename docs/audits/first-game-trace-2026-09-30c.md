# A04, third run — after the spatial and roster investigation

Produced by `npm run first:game`, unedited. Generation remains frozen.

```

1 · SELECTION — A04
===================
  Beat Defenders 1v1
    game form                GF2
    foundation constraint    tl-v0-constraint-central-density-condition
    shaping constraint       tl-v0-constraint-wide-zone-advantage
    consequence constraint   tl-v0-constraint-progression-bonus
    constraint               tl-v0-constraint-turnover-reward
    affordance lens (not contracted knowledge) tl-v0-lens-line-breaking-opportunity
    affordance lens (not contracted knowledge) tl-v0-lens-space-creation-opportunity
    affordance lens (not contracted knowledge) tl-v0-lens-possession-stability-opportunity
  contracted 2/8; missing 3: tl-v0-constraint-central-density-condition, tl-v0-constraint-progression-bonus, tl-v0-constraint-turnover-reward

2 · RESOLVED GAME
=================
  contracts 2  ·  lines 39
  derived 18  ·  open 6  ·  existential 2  ·  not established 8
  collisions 0

  pre-realization      PRE_REALIZATION_SATISFIED
  realization authorized YES
  post-realization still required (5):
      GA-ENVELOPE-FIT        every region and object is non-empty
          owes: the chosen extent of every region and object
      GA-ENVELOPE-FIT        every region and object lies inside the area
          owes: the chosen placement of every region and object
      GA-LAYOUT-FEASIBLE     every geometric extent, open or realized, admits a joint assignment inside the area
          owes: the chosen value for c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a::S5, whose SET bound is not itself a linear constraint
      GA-ONE-PRIMARY-EVENT   exactly one primary event, of a registered kind
          owes: the chosen primary-event kind, from the set the selection narrowed
      GA-ROSTER-SUM          outfield + goalkeepers + neutrals = the session players
          owes: the instantiated teams, whose existence is asserted and whose members nothing individuates

3 · REALIZATION REQUEST — what the game asks of realization, and on whose authority
===================================================================================
  CHOOSE       space.regions[c:restated:GF2:GF2-03.a].noun
               c:restated:GF2:GF2-03.a::S3  (FREE(choice))
               one of ["zone","line"]
  CHOOSE       space.regions[c:restated:GF2:GF2-03.a].position.across
               c:restated:GF2:GF2-03.a::S6  (FREE(a))
               bounded by [{"kind":"SET","members":["extends across the axis: the target lies across the direction of progression"]}]
               authority SD-39
  CHOOSE       space.regions[c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a].position.along
               c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a::S5  (FREE(a))
               bounded by [{"kind":"SET","members":["the full axis extent, end line to end line"]}]
               authority SD-39
  CHOOSE       space.regions[c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03].position.along
               c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03::S5  (FREE(a))
               bounded by [{"kind":"SET","members":["the full axis extent, end line to end line"]}]
               authority SD-39
  CHOOSE       space.regions[c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-08.d].position.along
               c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-08.d::S5  (FREE(a))
               bounded by [{"kind":"SET","members":["the full axis extent, end line to end line"]}]
               authority SD-39
  CHOOSE       value.primaryEvent.kind
               game::V1  (FREE(choice))
               one of ["line_crossed","target_zone_entered"]
               authority SD-39
  SATISFIED    objectives[]  (min 1, max -)  from restated:GF2::GF2-09.a
               already established: c:restated:GF2:GF2-08.a
               nothing owed — no member may be instantiated for it
  INSTANTIATE  performers.teams[]  (min 2, max -)  from restated:GF2::GF2-14.a
               2 member(s) owed

4 · REALIZATION DECISIONS
=========================
  c:restated:GF2:GF2-03.a::S3
      -> "line"
      at space.regions[c:restated:GF2:GF2-03.a].noun;  bound WITHIN_PERMITTED_SET;  authority none carried
      because one of the two alternatives GF2 permits (zone or line). A line is chosen because GF2 authors no depth for the target and a line needs none - a zone would leave an extent question the knowledge does not answer.
  c:restated:GF2:GF2-03.a::S6
      -> "extends across the axis: the target lies across the direction of progression"
      at space.regions[c:restated:GF2:GF2-03.a].position.across;  bound WITHIN_PERMITTED_SET;  authority SD-39
      because the single member of the authored bound GF2-05.b. Adopting it is the only value inside the bound; no metre value is invented for it.
  c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a::S5
      -> "the full axis extent, end line to end line"
      at space.regions[c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a].position.along;  bound WITHIN_PERMITTED_SET;  authority SD-39
      because the single member of Wide Zone's authored bound for a channel's along-extent.
  c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03::S5
      -> "the full axis extent, end line to end line"
      at space.regions[c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03].position.along;  bound WITHIN_PERMITTED_SET;  authority SD-39
      because the same authored bound, on the second channel.
  c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-08.d::S5
      -> "the full axis extent, end line to end line"
      at space.regions[c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-08.d].position.along;  bound WITHIN_PERMITTED_SET;  authority SD-39
      because the same authored bound, on the third channel.
  game::V1
      -> "line_crossed"
      at value.primaryEvent.kind;  bound WITHIN_PERMITTED_SET;  authority SD-39
      because one of the two kinds the selection narrowed to. line_crossed is consistent with the target realized as a line; target_zone_entered would contradict the S3 choice.
  c:restated:GF2:GF2-14.a -> {"designation":"ATTACKING_TEAM"} at performers.teams[]
      because GF2-14.a asserts at least two teams exist and individuates none. First of the two.
  c:restated:GF2:GF2-14.a -> {"designation":"DEFENDING_TEAM"} at performers.teams[]
      because second of the two the claim asserts. Two instantiations, because the claim's cardinality is part of the claim.

5 · ACCEPTANCE — nothing lost, nothing invented, nothing closed without authority
=================================================================================
  nothing closed without authority     ok
  nothing derived is lost              ok
  nothing is invented                  ok

6 · CONCRETE GAME
=================
  {
   "envelope": {
    "players": 12,
    "area": {
     "length_m": 40,
     "width_m": 30
    },
    "duration_min": 20
   },
   "space": {
    "axis": "the longer envelope dimension",
    "regions": [
     {
      "elementId": "c:restated:GF2:GF2-03.a",
      "position": {
       "along": "attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior",
       "across": "extends across the axis: the target lies across the direction of progression"
      },
      "noun": "line",
      "realizedGeometry": {
       "position": {
        "along": {
         "asAuthored": "attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior",
         "axis": "along",
         "anchor": 40,
         "extentUnresolved": true,
         "why": "it touches an end line, which fixes one coordinate. DEPTH IS NOT STATED - GF2 records \"extent of the target feature (depth of a zone)\" as unauthored - so the extent remains unresolved"
        },
        "across": {
         "asAuthored": "extends across the axis: the target lies across the direction of progression",
         "axis": "across",
         "interval": {
          "from": 0,
          "to": 30
         },
         "extentUnresolved": false,
         "why": "extending across the axis spans the across dimension; the phrase states both ends"
        }
       }
      }
     },
     {
      "elementId": "c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a",
      "noun": "channel",
      "position": {
       "across": "touchline-adjacent",
       "along": "the full axis extent, end line to end line"
      },
      "realizedGeometry": {
       "position": {
        "across": {
         "asAuthored": "touchline-adjacent",
         "axis": "across",
         "anchor": 0,
         "extentBound": {
          "kind": "COUNT",
          "min": 6,
          "max": 10,
          "term": "across-interval width about 6-10 m",
          "preferred": true
         },
         "extentUnresolved": true,
         "why": "the outer edge lies on a touchline. WIDTH IS NOT STATED - Wide Zone records \"no scaling rule for width\" - so this is an anchor and the extent remains unresolved An extent IS authored ({\"min\":6,\"max\":10}) but as a PREFERRED_DEFAULT, so it is offered and not composed: the required extent remains unauthored."
        },
        "along": {
         "asAuthored": "the full axis extent, end line to end line",
         "axis": "along",
         "interval": {
          "from": 0,
          "to": 40
         },
         "extentUnresolved": false,
         "why": "end line to end line is the whole axis; the phrase states both ends"
        }
       }
      }
     },
     {
      "elementId": "c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03",
      "noun": "channel",
      "position": {
       "across": "touchline-adjacent",
       "along": "the full axis extent, end line to end line"
      },
      "realizedGeometry": {
       "position": {
        "across": {
         "asAuthored": "touchline-adjacent",
         "axis": "across",
         "anchor": 0,
         "extentBound": {
          "kind": "COUNT",
          "min": 6,
          "max": 10,
          "term": "across-interval width about 6-10 m",
          "preferred": true
         },
         "extentUnresolved": true,
         "why": "the outer edge lies on a touchline. WIDTH IS NOT STATED - Wide Zone records \"no scaling rule for width\" - so this is an anchor and the extent remains unresolved An extent IS authored ({\"min\":6,\"max\":10}) but as a PREFERRED_DEFAULT, so it is offered and not composed: the required extent remains unauthored."
        },
        "along": {
         "asAuthored": "the full axis extent, end line to end line",
         "axis": "along",
         "interval": {
          "from": 0,
          "to": 40
         },
         "extentUnresolved": false,
         "why": "end line to end line is the whole axis; the phrase states both ends"
        }
       }
      }
     },
     {
      "elementId": "c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-08.d",
      "noun": "channel",
      "position": {
       "across": "touchline-adjacent",
       "along": "the full axis extent, end line to end line"
      },
      "realizedGeometry": {
       "position": {
        "across": {
         "asAuthored": "touchline-adjacent",
         "axis": "across",
         "anchor": 0,
         "extentBound": {
          "kind": "COUNT",
          "min": 6,
          "max": 10,
          "term": "across-interval width about 6-10 m",
          "preferred": true
         },
         "extentUnresolved": true,
         "why": "the outer edge lies on a touchline. WIDTH IS NOT STATED - Wide Zone records \"no scaling rule for width\" - so this is an anchor and the extent remains unresolved An extent IS authored ({\"min\":6,\"max\":10}) but as a PREFERRED_DEFAULT, so it is offered and not composed: the required extent remains unauthored."
        },
        "along": {
         "asAuthored": "the full axis extent, end line to end line",
         "axis": "along",
         "interval": {
          "from": 0,
          "to": 40
         },
         "extentUnresolved": false,
         "why": "end line to end line is the whole axis; the phrase states both ends"
        }
       }
      }
     }
    ]
   },
   "value": {
    "primaryEvent": {
     "value": 1,
     "kind": "line_crossed"
    }
   },
   "objectives": [
    {
     "elementId": "c:restated:GF2:GF2-08.a",
     "reference": {
      "structuralRef": {
       "contractId": "restated:GF2",
       "itemId": "GF2-03.a"
      },
      "asAuthored": "the target feature: the objective-area region of GF2-03.a (line or zone)"
     },
     "team": "EACH_TEAM",
     "role": "PRIMARY_SCORING"
    }
   ],
   "transitions": [
    {
     "elementId": "c:restated:GF2:GF2-07.a",
     "playState": "CONTINUE",
     "startsEpisode": true
    }
   ],
   "performers": {
    "teams": [
     {
      "designation": "ATTACKING_TEAM",
      "satisfies": "c:restated:GF2:GF2-14.a"
     },
     {
      "designation": "DEFENDING_TEAM",
      "satisfies": "c:restated:GF2:GF2-14.a"
     }
    ]
   }
  }

7 · POST-REALIZATION GATE A — the same invariants, now that their subjects exist
================================================================================
  STILL_NOT_EVALUABLE            GA-ENVELOPE-FIT        every region and object is non-empty
      every placement it would compare is a value realization supplies
  STILL_NOT_EVALUABLE            GA-ENVELOPE-FIT        every region and object lies inside the area
      every placement it would compare is a value realization supplies
  NOT_EVALUABLE                  GA-LAYOUT-FEASIBLE     every geometric extent, open or realized, admits a joint assignment inside the area
      a realized placement on c:restated:GF2:GF2-03.a::S5 is not an interval this check can compare
  PASS                           GA-ONE-PRIMARY-EVENT   exactly one primary event, of a registered kind
  NOT_EVALUABLE                  GA-ROSTER-SUM          outfield + goalkeepers + neutrals = the session players
      4 subject line(s) failed: realized:c:restated:GF2:GF2-14.a:0::P2, realized:c:restated:GF2:GF2-14.a:0::P3, realized:c:restated:GF2:GF2-14.a:1::P2, realized:c:restated:GF2:GF2-14.a:1::P3

  validated (render-eligible)  NO
      outstanding: GA-ENVELOPE-FIT — "every region and object is non-empty": STILL_NOT_EVALUABLE (every placement it would compare is a value realization supplies)
      outstanding: GA-ENVELOPE-FIT — "every region and object lies inside the area": STILL_NOT_EVALUABLE (every placement it would compare is a value realization supplies)
      outstanding: GA-LAYOUT-FEASIBLE — "every geometric extent, open or realized, admits a joint assignment inside the area": NOT_EVALUABLE (a realized placement on c:restated:GF2:GF2-03.a::S5 is not an interval this check can compare)
      outstanding: GA-ROSTER-SUM — "outfield + goalkeepers + neutrals = the session players": NOT_EVALUABLE (4 subject line(s) failed: realized:c:restated:GF2:GF2-14.a:0::P2, realized:c:restated:GF2:GF2-14.a:0::P3, realized:c:restated:GF2:GF2-14.a:1::P2, realized:c:restated:GF2:GF2-14.a:1::P3)

RESULT
======
  realization acceptance      PASSED
  post-realization Gate A     NOT PASSED
  render-eligible             NO
```
