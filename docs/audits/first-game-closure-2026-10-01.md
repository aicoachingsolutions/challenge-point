# A04 — CLOSURE RUN

Produced by `npm run first:game`, unedited. 246 tests green. Generation remains frozen.

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
         "term": "attacking end (of team T)",
         "axis": "along",
         "interval": {
          "from": 40,
          "to": 40
         },
         "anchor": 40,
         "extentUnresolved": false,
         "why": "the prose test is \"touches the end line T attacks\", which fixes one edge and states no depth The element's noun gives it extent in one dimension and its other axis carries that extent, so its extent on this axis is zero."
        },
        "across": {
         "asAuthored": "extends across the axis: the target lies across the direction of progression",
         "term": "full extent (of an axis)",
         "axis": "across",
         "interval": {
          "from": 0,
          "to": 30
         },
         "extentUnresolved": false,
         "why": "An element spanning the whole of an axis, which is what \"end line to end line\" and \"extends across the axis\" both state. Axis-free, so one term serves both. APPROVED by Christian 1 October as a canonical addition to RC-21; no parallel spatial representation is kept beside it."
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
         "term": "touchline-adjacent",
         "axis": "across",
         "interval": {
          "from": 0,
          "to": 7.5
         },
         "anchor": 0,
         "extentBound": {
          "kind": "COUNT",
          "min": 0.15,
          "max": 0.25,
          "term": "bounded minority (of an axis)",
          "fractionOfAxis": true,
          "preferred": false,
          "preferenceWithin": {
           "min": 6,
           "max": 7.5,
           "compatible": true,
           "note": "the preference, expressed inside the requirement, in metres"
          }
         },
         "extentUnresolved": false,
         "why": "the prose test is \"touches a touchline\", which fixes one edge and states no width Extent composed from the authored required bound {\"kind\":\"COUNT\",\"min\":0.15,\"max\":0.25,\"term\":\"bounded minority (of an axis)\",\"fractionOfAxis\":true,\"preferred\":false,\"preferenceWithin\":{\"min\":6,\"max\":7.5,\"compatible\":true,\"note\":\"the preference, expressed inside the requirement, in metres\"}}; containment is checked at the widest permitted extent."
        },
        "along": {
         "asAuthored": "the full axis extent, end line to end line",
         "term": "full extent (of an axis)",
         "axis": "along",
         "interval": {
          "from": 0,
          "to": 40
         },
         "extentUnresolved": false,
         "why": "An element spanning the whole of an axis, which is what \"end line to end line\" and \"extends across the axis\" both state. Axis-free, so one term serves both. APPROVED by Christian 1 October as a canonical addition to RC-21; no parallel spatial representation is kept beside it."
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
         "term": "touchline-adjacent",
         "axis": "across",
         "interval": {
          "from": 0,
          "to": 7.5
         },
         "anchor": 0,
         "extentBound": {
          "kind": "COUNT",
          "min": 0.15,
          "max": 0.25,
          "term": "bounded minority (of an axis)",
          "fractionOfAxis": true,
          "preferred": false,
          "preferenceWithin": {
           "min": 6,
           "max": 7.5,
           "compatible": true,
           "note": "the preference, expressed inside the requirement, in metres"
          }
         },
         "extentUnresolved": false,
         "why": "the prose test is \"touches a touchline\", which fixes one edge and states no width Extent composed from the authored required bound {\"kind\":\"COUNT\",\"min\":0.15,\"max\":0.25,\"term\":\"bounded minority (of an axis)\",\"fractionOfAxis\":true,\"preferred\":false,\"preferenceWithin\":{\"min\":6,\"max\":7.5,\"compatible\":true,\"note\":\"the preference, expressed inside the requirement, in metres\"}}; containment is checked at the widest permitted extent."
        },
        "along": {
         "asAuthored": "the full axis extent, end line to end line",
         "term": "full extent (of an axis)",
         "axis": "along",
         "interval": {
          "from": 0,
          "to": 40
         },
         "extentUnresolved": false,
         "why": "An element spanning the whole of an axis, which is what \"end line to end line\" and \"extends across the axis\" both state. Axis-free, so one term serves both. APPROVED by Christian 1 October as a canonical addition to RC-21; no parallel spatial representation is kept beside it."
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
         "term": "touchline-adjacent",
         "axis": "across",
         "interval": {
          "from": 0,
          "to": 7.5
         },
         "anchor": 0,
         "extentBound": {
          "kind": "COUNT",
          "min": 0.15,
          "max": 0.25,
          "term": "bounded minority (of an axis)",
          "fractionOfAxis": true,
          "preferred": false,
          "preferenceWithin": {
           "min": 6,
           "max": 7.5,
           "compatible": true,
           "note": "the preference, expressed inside the requirement, in metres"
          }
         },
         "extentUnresolved": false,
         "why": "the prose test is \"touches a touchline\", which fixes one edge and states no width Extent composed from the authored required bound {\"kind\":\"COUNT\",\"min\":0.15,\"max\":0.25,\"term\":\"bounded minority (of an axis)\",\"fractionOfAxis\":true,\"preferred\":false,\"preferenceWithin\":{\"min\":6,\"max\":7.5,\"compatible\":true,\"note\":\"the preference, expressed inside the requirement, in metres\"}}; containment is checked at the widest permitted extent."
        },
        "along": {
         "asAuthored": "the full axis extent, end line to end line",
         "term": "full extent (of an axis)",
         "axis": "along",
         "interval": {
          "from": 0,
          "to": 40
         },
         "extentUnresolved": false,
         "why": "An element spanning the whole of an axis, which is what \"end line to end line\" and \"extends across the axis\" both state. Axis-free, so one term serves both. APPROVED by Christian 1 October as a canonical addition to RC-21; no parallel spatial representation is kept beside it."
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
  PASS                           GA-ENVELOPE-FIT        every region and object is non-empty
  PASS                           GA-ENVELOPE-FIT        every region and object lies inside the area
  PASS                           GA-LAYOUT-FEASIBLE     every geometric extent, open or realized, admits a joint assignment inside the area
  PASS                           GA-ONE-PRIMARY-EVENT   exactly one primary event, of a registered kind
  PASS                           GA-ROSTER-SUM          outfield + goalkeepers + neutrals = the session players

  validated (render-eligible)  YES

RESULT
======
  realization acceptance      PASSED
  post-realization Gate A     PASSED
  render-eligible             YES
```
