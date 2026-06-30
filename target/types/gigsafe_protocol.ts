/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/gigsafe_protocol.json`.
 */
export type GigsafeProtocol = {
  "address": "GKPM5kb97EieoTcCwQcKDhyCqai7YY6Mc9vkZjfgbv1A",
  "metadata": {
    "name": "gigsafeProtocol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "GigSafe — Trustless freelance escrow on Solana"
  },
  "instructions": [
    {
      "name": "acceptGig",
      "docs": [
        "Freelancer accepts the gig."
      ],
      "discriminator": [
        94,
        129,
        189,
        107,
        220,
        74,
        82,
        57
      ],
      "accounts": [
        {
          "name": "gig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gig.client",
                "account": "gigAccount"
              },
              {
                "kind": "arg",
                "path": "gigId"
              }
            ]
          }
        },
        {
          "name": "freelancer",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "gigId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "approveMilestone",
      "docs": [
        "Client approves a milestone → releases payment to freelancer."
      ],
      "discriminator": [
        145,
        85,
        92,
        60,
        50,
        130,
        219,
        106
      ],
      "accounts": [
        {
          "name": "gig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  105,
                  103
                ]
              },
              {
                "kind": "arg",
                "path": "clientKey"
              },
              {
                "kind": "arg",
                "path": "gigId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "gig"
              }
            ]
          }
        },
        {
          "name": "client",
          "writable": true,
          "signer": true
        },
        {
          "name": "freelancerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "freelancerWallet"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "freelancerWallet"
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "clientKey",
          "type": "pubkey"
        },
        {
          "name": "gigId",
          "type": "u64"
        },
        {
          "name": "milestoneIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "cancelGig",
      "docs": [
        "Client cancels a gig before freelancer accepts. Full refund."
      ],
      "discriminator": [
        109,
        142,
        65,
        80,
        226,
        145,
        135,
        185
      ],
      "accounts": [
        {
          "name": "gig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  105,
                  103
                ]
              },
              {
                "kind": "arg",
                "path": "clientKey"
              },
              {
                "kind": "arg",
                "path": "gigId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "gig"
              }
            ]
          }
        },
        {
          "name": "client",
          "writable": true,
          "signer": true
        },
        {
          "name": "clientTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "client"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "clientKey",
          "type": "pubkey"
        },
        {
          "name": "gigId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createGig",
      "docs": [
        "Create a new gig with milestones."
      ],
      "discriminator": [
        175,
        168,
        234,
        97,
        64,
        177,
        7,
        144
      ],
      "accounts": [
        {
          "name": "gig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "client"
              },
              {
                "kind": "arg",
                "path": "gigId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "gig"
              }
            ]
          }
        },
        {
          "name": "client",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "gigId",
          "type": "u64"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "milestoneAmounts",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "deadline",
          "type": "i64"
        }
      ]
    },
    {
      "name": "fundGig",
      "docs": [
        "Client deposits tokens into the escrow PDA."
      ],
      "discriminator": [
        47,
        107,
        217,
        195,
        133,
        87,
        27,
        81
      ],
      "accounts": [
        {
          "name": "gig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "client"
              },
              {
                "kind": "arg",
                "path": "gigId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "gig"
              }
            ]
          }
        },
        {
          "name": "client",
          "writable": true,
          "signer": true
        },
        {
          "name": "clientTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "client"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "gig.token_mint",
                "account": "gigAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "gigId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "requestDispute",
      "docs": [
        "Either party raises a dispute."
      ],
      "discriminator": [
        36,
        131,
        195,
        195,
        170,
        163,
        154,
        14
      ],
      "accounts": [
        {
          "name": "gig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gig.client",
                "account": "gigAccount"
              },
              {
                "kind": "arg",
                "path": "gigId"
              }
            ]
          }
        },
        {
          "name": "caller",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "gigId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resolveDispute",
      "docs": [
        "Resolve a dispute by splitting remaining escrow funds.",
        "freelancer_bps: basis points for freelancer (0-10000)",
        "Remaining goes to client."
      ],
      "discriminator": [
        231,
        6,
        202,
        6,
        96,
        103,
        12,
        230
      ],
      "accounts": [
        {
          "name": "gig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  105,
                  103
                ]
              },
              {
                "kind": "arg",
                "path": "clientKey"
              },
              {
                "kind": "arg",
                "path": "gigId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "gig"
              }
            ]
          }
        },
        {
          "name": "resolver",
          "docs": [
            "Resolver can be client (for now). Future: DAO/arbitrator."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "freelancerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "freelancerWallet"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "clientTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "clientWallet"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "freelancerWallet"
        },
        {
          "name": "clientWallet"
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "clientKey",
          "type": "pubkey"
        },
        {
          "name": "gigId",
          "type": "u64"
        },
        {
          "name": "freelancerBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "submitMilestone",
      "docs": [
        "Freelancer submits a milestone as complete."
      ],
      "discriminator": [
        35,
        96,
        220,
        215,
        102,
        83,
        139,
        52
      ],
      "accounts": [
        {
          "name": "gig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gig.client",
                "account": "gigAccount"
              },
              {
                "kind": "arg",
                "path": "gigId"
              }
            ]
          }
        },
        {
          "name": "freelancer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "gigId",
          "type": "u64"
        },
        {
          "name": "milestoneIndex",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "gigAccount",
      "discriminator": [
        79,
        90,
        80,
        92,
        149,
        143,
        118,
        126
      ]
    }
  ],
  "events": [
    {
      "name": "disputeRaised",
      "discriminator": [
        246,
        167,
        109,
        37,
        142,
        45,
        38,
        176
      ]
    },
    {
      "name": "disputeResolved",
      "discriminator": [
        121,
        64,
        249,
        153,
        139,
        128,
        236,
        187
      ]
    },
    {
      "name": "gigAccepted",
      "discriminator": [
        6,
        108,
        227,
        152,
        237,
        213,
        4,
        1
      ]
    },
    {
      "name": "gigCancelled",
      "discriminator": [
        125,
        193,
        224,
        148,
        176,
        113,
        250,
        18
      ]
    },
    {
      "name": "gigCreated",
      "discriminator": [
        99,
        221,
        204,
        160,
        24,
        21,
        102,
        174
      ]
    },
    {
      "name": "gigFunded",
      "discriminator": [
        73,
        187,
        35,
        12,
        30,
        175,
        49,
        104
      ]
    },
    {
      "name": "milestoneApproved",
      "discriminator": [
        40,
        109,
        159,
        144,
        169,
        230,
        35,
        229
      ]
    },
    {
      "name": "milestoneSubmitted",
      "discriminator": [
        242,
        19,
        75,
        99,
        12,
        28,
        19,
        33
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidTitle",
      "msg": "Title must be 1-64 characters"
    },
    {
      "code": 6001,
      "name": "invalidBudget",
      "msg": "Budget must be greater than zero"
    },
    {
      "code": 6002,
      "name": "invalidMilestoneCount",
      "msg": "Must have 1-10 milestones"
    },
    {
      "code": 6003,
      "name": "invalidMilestoneAmount",
      "msg": "Each milestone amount must be greater than zero"
    },
    {
      "code": 6004,
      "name": "deadlineInPast",
      "msg": "Deadline must be in the future"
    },
    {
      "code": 6005,
      "name": "gigNotOpen",
      "msg": "Gig is not open"
    },
    {
      "code": 6006,
      "name": "gigNotActive",
      "msg": "Gig is not active"
    },
    {
      "code": 6007,
      "name": "gigNotDisputed",
      "msg": "Gig is not disputed"
    },
    {
      "code": 6008,
      "name": "alreadyFunded",
      "msg": "Gig is already funded"
    },
    {
      "code": 6009,
      "name": "notFunded",
      "msg": "Gig must be funded before accepting"
    },
    {
      "code": 6010,
      "name": "alreadyAccepted",
      "msg": "Gig already has a freelancer"
    },
    {
      "code": 6011,
      "name": "cannotAcceptOwnGig",
      "msg": "Cannot accept your own gig"
    },
    {
      "code": 6012,
      "name": "invalidMilestoneIndex",
      "msg": "Invalid milestone index"
    },
    {
      "code": 6013,
      "name": "milestoneNotPending",
      "msg": "Milestone is not pending"
    },
    {
      "code": 6014,
      "name": "milestoneNotSubmitted",
      "msg": "Milestone is not submitted"
    },
    {
      "code": 6015,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6016,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6017,
      "name": "invalidDisputeShares",
      "msg": "Dispute shares must be 0-10000 basis points"
    }
  ],
  "types": [
    {
      "name": "disputeRaised",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gigId",
            "type": "u64"
          },
          {
            "name": "raisedBy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "disputeResolved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gigId",
            "type": "u64"
          },
          {
            "name": "freelancerAmount",
            "type": "u64"
          },
          {
            "name": "clientRefund",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gigAccepted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gigId",
            "type": "u64"
          },
          {
            "name": "freelancer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "gigAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "client",
            "type": "pubkey"
          },
          {
            "name": "freelancer",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "totalBudget",
            "type": "u64"
          },
          {
            "name": "fundedAmount",
            "type": "u64"
          },
          {
            "name": "releasedAmount",
            "type": "u64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "milestoneCount",
            "type": "u8"
          },
          {
            "name": "milestoneAmounts",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "milestoneStatuses",
            "type": "bytes"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "gigId",
            "type": "u64"
          },
          {
            "name": "escrowBump",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gigCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gigId",
            "type": "u64"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gigCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gigId",
            "type": "u64"
          },
          {
            "name": "client",
            "type": "pubkey"
          },
          {
            "name": "totalBudget",
            "type": "u64"
          },
          {
            "name": "milestoneCount",
            "type": "u8"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "deadline",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "gigFunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gigId",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "milestoneApproved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gigId",
            "type": "u64"
          },
          {
            "name": "milestoneIndex",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "milestoneSubmitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gigId",
            "type": "u64"
          },
          {
            "name": "milestoneIndex",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
