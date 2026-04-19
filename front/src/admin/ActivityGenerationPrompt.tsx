import { FormWrapper } from '@/form-control'
import { TextAreaField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'
import { IActivityGenerationPrompt } from '@/MODELS/activityGenerationPrompt'
import { useState } from 'react'

export default function ActivityGenerationPrompt() {


// Define tab types
type TabType = 'processExplanation' | 'initialPrompt' | 'responseGuidelines' | 'promptPreview'

// Tab configuration array
const tabs: Array<{ id: TabType; label: string }> = [
  { id: 'processExplanation', label: 'Process Explanation' },
  { id: 'initialPrompt', label: 'Initial Prompt' },
  { id: 'responseGuidelines', label: 'Response Guidelines' },
  { id: 'promptPreview', label: 'Prompt Preview' }
]

  const [currentTab, setCurrentTab] = useState<TabType>('processExplanation')


    return (
        <div className="max-w-4xl px-4 py-8 mx-auto">
            <header className="mb-8">
                <h1 className="mb-4 text-3xl font-bold text-gray-800">Legacy AI Prompt Management</h1>
                <div className="p-4 mb-6 bg-yellow-100 border-l-4 border-yellow-500">
                    <p className="text-yellow-700 ">
                        The active generation pipeline is now system-led. These legacy prompt fields no longer control affordance, archetype, or constraint selection.
                       
                    </p>
                </div>
            </header>
     {/* Styled Tabs */}
            <div className="mb-8 border-b border-gray-200">
                <nav className="flex justify-between -mb-px" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                currentTab === tab.id
                                    ? 'border-brand-600 text-brand-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            aria-current={currentTab === tab.id ? 'page' : undefined}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

          {currentTab === 'processExplanation' && <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm process-description">
              <h2 className="mb-4 text-xl font-semibold">Process Explanation</h2>
              
              <div className="space-y-4">
                <div className="step">
                  <h3 className="mb-2 text-lg font-medium">1. System Selection</h3>
                  <p className="text-gray-700">
                    The live generation pipeline now selects affordances, archetypes, and constraint packages in backend code before any AI call is made.
                  </p>
                </div>

                <div className="step">
                  <h3 className="mb-2 text-lg font-medium">2. Constraint Package Validation</h3>
                  <p className="text-gray-700">
                    The selected package is validated in code to ensure the affordance, archetype, and constraints fit together and still preserve decision-making and multiple solutions.
                  </p>
                </div>

                <div className="step">
                  <h3 className="mb-2 text-lg font-medium">3. AI Assembly</h3>
                  <p className="text-gray-700">
                    AI is now used only to assemble concrete activity options from the already selected system inputs.
                  </p>
                  <p className="mt-2 text-gray-700">
                    The assembly step receives the selected affordance(s), archetype, validated constraint package, and session context, and the returned activity is validated again before it reaches the coach.
                  </p>
                </div>
              </div>
            </div>}

            <section className="my-6">
               

                <FormWrapper<IActivityGenerationPrompt>
                    endpoint={ROUTES.admin.activityGenerationPrompt}
                    id={'any'}
                    submitButtonAlignment='center'
                    submitButtonText={'Save Changes'}
                    submitButtonClass='mt-10 w-full sm:w-1/2 bg-brand-600 hover:bg-brand-700 text-white py-2 px-4 rounded-md shadow transition duration-200'
                >
                    {(f, {formValues}) => (
                        <>
                        {currentTab === 'initialPrompt'  && <div className="space-y-6">
                            <div className="p-5 bg-white border border-gray-200 rounded-md">
                                <h3 className="mb-3 text-lg font-medium text-gray-700">Overview</h3>
                                <p className="mb-3 text-sm text-gray-600">
                                    This section introduces the AI to its role. It should describe the overall purpose of generating football/soccer training activities.
                                </p>
                                <p className="mb-3 text-sm italic text-brand-600">
                                    Example: "You are an expert in designing football/soccer training activities tailored to specific learning objectives. Your task is to create engaging, pedagogically sound training activities that help players develop key skills and tactical understanding."
                                </p>
                                <TextAreaField {...f('overview')} className="w-full" rows={5} />
                            </div>
                            
                            <div className="p-5 border border-gray-200 rounded-md bg-gray-50">
                                <h3 className="mb-3 text-lg font-medium text-gray-700">Dynamic Parameters</h3>
                                <p className="mb-3 text-sm text-gray-600">
                                    These lines insert the user's selections for challenge level, duration, and learning goals. These variables are automatically populated based on what the coach selects in the activity creation form.
                                </p>
                                <pre className="p-3 overflow-x-auto text-sm text-gray-600 bg-white rounded">
{`\${challengeLevel ? \`The activities should be designed for a \${challengeLevel} challenge level.\` : ''}
\${duration ? \`Each activity should be designed to last approximately \${duration} minutes.\` : ''}
\${learningGoals && learningGoals.length > 0 ? \`The activities should focus on these specific learning goals: \${learningGoals.join(', ')}.\` : ''}`}
                                </pre>
                            </div>
                            
                            <div className="p-5 bg-white border border-gray-200 rounded-md">
                                <h3 className="mb-3 text-lg font-medium text-gray-700">Affordances & Constraints</h3>
                                <p className="mb-3 text-sm text-gray-600">
                                    This section explains how to use affordances (elements that encourage specific behaviors) and constraints (limitations that shape player decisions) in the activity design.
                                </p>
                                <p className="mb-3 text-sm italic text-brand-600">
                                    Example: "Use the following affordances and constraints to design effective activities: 
                                    - Affordances are game elements that encourage specific behaviors or actions 
                                    - Constraints are deliberate limitations that shape player decision-making and skill development
                                    - Select the most appropriate affordances and constraints to target the specified learning goals"
                                </p>
                                <TextAreaField {...f('affordancesConstraints')} className="w-full" rows={5} />
                            </div>
                            
                            <div className="p-5 border border-gray-200 rounded-md bg-gray-50">
                                <h3 className="mb-3 text-lg font-medium text-gray-700">Previous Activities</h3>
                                <p className="mb-3 text-sm text-gray-600">
                                    This code inserts any previous activities from the current session to ensure variety and progression in the training session.
                                </p>
                                <pre className="p-3 overflow-x-auto text-sm text-gray-600 bg-white rounded">
{`\${previousActivities && \`The activities should be meaningfully different from the previous activities in this session: \${previousActivities}\`}`}
                                </pre>
                            </div>
                            </div>}
                            {currentTab === 'responseGuidelines' && <div className='space-y-6'>
                            <div className="p-5 border border-gray-200 rounded-md bg-gray-50">
                                <h3 className="mb-3 text-lg font-medium text-gray-700">Output JSON Structure</h3>
                                <p className="mb-3 text-sm text-gray-600">
                                    This defines the format the AI must use when responding. Don't modify this structure unless you're also updating the application code that processes the response.
                                </p>
                                <pre className="p-3 overflow-x-auto text-sm text-gray-600 bg-white rounded max-h-[20vh] overflow-y-scroll">
{`For each request, you must output a JSON object with the following structure:

{
"generatedActivities":

[{"title": string
    "constraint": string,
    "intent": string,
    "playerGroupSizes": number,
    "scaffolding": string[], 
    "extensions": string[],
    "equipmentNeeded": string[], 
    "affordancesUsed": string[],
    "constraintsUsed": string[],
    "rules": string[],
    "scoringSystem": string,
    "winCondition": string
}, {"title": string
    "constraint": string,
    "intent": string,
    "playerGroupSizes": number,
    "scaffolding": string[], 
    "extensions": string[],
    "equipmentNeeded": string[], 
    "affordancesUsed": string[],
    "constraintsUsed": string[],
    "rules": string[],
    "scoringSystem": string,
    "winCondition": string
}, {"title": string
    "constraint": string,
    "intent": string,
    "scaffolding": string[], 
    "extensions": string[],
    "playerGroupSizes": number,
    "equipmentNeeded": string[], 
    "affordancesUsed": string[],
    "constraintsUsed": string[],
    "rules": string[] 
    "scoringSystem": string,
    "winCondition": string
}]
}
`}
                                </pre>
                            </div>

                            <div className="p-5 bg-white border border-gray-200 rounded-md">
                                <h3 className="mb-4 text-xl font-medium text-gray-800">Response Guidelines</h3>
                                <p className="mb-4 text-sm text-gray-600">
                                    The following sections provide detailed instructions to the AI on how each field in the activity should be structured. These guidelines directly impact the quality and usefulness of the generated activities.
                                </p>
                                
                                <div className="space-y-5">
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Title Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should create titles for the activities.
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "concise, descriptive, and engaging, clearly indicating the main focus of the activity. Avoid generic titles and ensure it reflects the learning objectives."
                                        </p>
                                        <TextAreaField {...f('title')} className="w-full" />
                                    </div>
                                    
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Constraint Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should write the activity constraint response.
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "provide a clear, step-by-step explanation of the constraint."
                                        </p>
                                        <TextAreaField {...f('constraint')} className="w-full" />
                                    </div>

                                     <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Intent Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should write the activity intent.
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "provide a clear explanation of the intent of the activity and how it connects to the learning goals."
                                        </p>
                                        <TextAreaField {...f('intent')} className="w-full" />
                                    </div>
                                    
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Extensions Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should create extensions (ways to make the activity more challenging).
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "offer 2-3 ways to increase the difficulty or complexity of the activity for more advanced players. These should build naturally on the base activity and push players to apply the targeted skills in more challenging contexts."
                                        </p>
                                        <TextAreaField {...f('extensions')} className="w-full" />
                                    </div>
                                    
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Scaffolding Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should create scaffolding (ways to make the activity easier for beginners).
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "provide 2-3 ways to simplify the activity for less experienced players or when first introducing the concept. These modifications should maintain the core learning objectives while reducing complexity."
                                        </p>
                                        <TextAreaField {...f('scaffolding')} className="w-full" />
                                    </div>
                                    
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Player Group Sizes Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should determine appropriate group sizes for activities.
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "indicate the ideal number of players for the activity, considering both total players and any smaller groups within the activity. Balance having enough players for realistic game situations while maximizing individual touches on the ball."
                                        </p>
                                        <TextAreaField {...f('playerGroupSizes')} className="w-full" />
                                        <p className="mt-2 text-sm text-gray-500">
                                            You should attempt to include as many participants as possible while ensuring they get as many opportunities to interact within the game.
                                        </p>
                                    </div>
                                    
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Equipment Needed Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should list equipment for activities.
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "list all necessary equipment for the activity, including balls, cones, goals, bibs/pinnies, and any specialized items. Be specific about quantities where relevant."
                                        </p>
                                        <TextAreaField {...f('equipmentNeeded')} className="w-full" />
                                    </div>
                                    
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Affordances & Constraints Used</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            This section explains how the AI should reference the affordances and constraints used in activity design. This technical section helps track which elements were used.
                                        </p>
                                        <p className="mb-2 text-sm text-gray-600">
                                            The "affordancesUsed" should be an array of the _ids of the affordances you used to design this activity.
                                            The "constraintsUsed" should be an array of the _ids of the constraints you used to design this activity.
                                        </p>
                                    </div>
                                     <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Rules Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should structure the rules for each activity.
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "clearly outline all game rules, including boundaries, restrictions, player roles, and any special conditions. Rules should be concise yet comprehensive, leaving no room for ambiguity."
                                        </p>
                                        <TextAreaField {...f('rules')} className="w-full" />
                                    </div>
                                    
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Scoring System Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should create scoring systems that reinforce learning objectives.
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "explain how points are earned during the activity. The scoring system should reinforce the learning objectives by rewarding desired behaviors and actions rather than just goals scored."
                                        </p>
                                        <TextAreaField {...f('scoringSystem')} className="w-full" />
                                    </div>
                                    
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Win Condition Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Explain how the AI should determine what constitutes "winning" in each activity.
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "specify how winners are determined, whether by reaching a point threshold, time limit, or completion of specific objectives. Ensure the win condition aligns with the learning goals."
                                        </p>
                                        <TextAreaField {...f('winCondition')} className="w-full" />
                                    </div>
                                    
                                    <div className="p-4 rounded bg-gray-50">
                                        <label className="block mb-2 font-medium text-gray-700 text-md">Final Response Guidelines</label>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Provide any final instructions to the AI about general principles to follow when creating activities.
                                        </p>
                                        <p className="mb-3 text-sm italic text-brand-600">
                                            Example: "focus on creating activities that are enjoyable, developmentally appropriate, and directly address the specified learning goals. Balance challenge and achievability to maintain player engagement. Use progressive game design that builds complexity gradually."
                                        </p>
                                        <TextAreaField {...f('finalGuidelines')} className="w-full" />
                                        <p className="mt-2 text-sm text-gray-500">
                                            Ensure your JSON is properly formatted. Do not include any text outside of the JSON object in your response.
                                            DO NOT WRAP THE ANSWER IN BACKTICKS!
                                        </p>
                                    </div>
                                </div>
                            </div>
                            </div>}
                            {currentTab === 'promptPreview' && <div className="p-5 border border-gray-200 rounded-md bg-gray-50">
                                <h3 className="mb-3 text-lg font-medium text-gray-700">Completed Prompt</h3>
                                <p className="text-sm text-gray-600">
                                    Below is the final prompt that will be sent to the AI.  
                                </p>
                                <p className='mb-3 text-sm text-gray-600'>The challenge level, duration, learning goals will be passed to the AI by the user generating the activities.</p>
                                <pre className="p-3 overflow-x-auto text-sm text-gray-600 bg-white rounded max-h-[60vh] overflow-y-scroll">
{`${formValues.overview}

\${challengeLevel ? \`The activities should be designed for a \${challengeLevel} challenge level.\` : ''}
\${duration ? \`Each activity should be designed to last approximately \${duration} minutes.\` : ''}
\${learningGoals && learningGoals.length > 0 ? \`The activities should focus on these specific learning goals: \${learningGoals.join(', ')}.\` : ''}

${formValues.affordancesConstraints}

\${previousActivities && \`The activities should be meaningfully different from the previous activities in this session: \${previousActivities}\`}

For each request, you must output a JSON object with the following structure:

{
"generatedActivities":

[{"title": string
    "constraint": string,
    "intent": string,
    "playerGroupSizes": number,
    "scaffolding": string[], 
    "extensions": string[],
    "equipmentNeeded": string[], 
    "affordancesUsed": string[],
    "constraintsUsed": string[],
    "rules": string[],
    "scoringSystem": string,
    "winCondition": string
}, {"title": string
    "constraint": string,
    "intent": string,
    "playerGroupSizes": number,
    "scaffolding": string[], 
    "extensions": string[],
    "equipmentNeeded": string[], 
    "affordancesUsed": string[],
    "constraintsUsed": string[],
    "rules": string[],
    "scoringSystem": string,
    "winCondition": string
}, {"title": string
    "constraint": string,
    "intent": string,
    "scaffolding": string[], 
    "extensions": string[],
    "playerGroupSizes": number,
    "equipmentNeeded": string[], 
    "affordancesUsed": string[],
    "constraintsUsed": string[],
    "rules": string[] 
    "scoringSystem": string,
    "winCondition": string
}]
}

Guidelines for creating your response:

The "title" should be ${formValues.title}

The "constraint" should be ${formValues.constraint}

The "intent" should be ${formValues.intent}

The "extensions" should be ${formValues.extensions}

The "scaffolding" should be ${formValues.scaffolding}

The "playerGroupSizes" should be ${formValues.playerGroupSizes}
You should attempt to include as many participants as possible while ensuring they get as many opportunities to interact within the game.

The "equipmentNeeded" should be ${formValues.equipmentNeeded}

The "affordancesUsed" should be an array of the _ids of the affordances you used to design this activity.
The "constraintsUsed" should be an array of the _ids of the constraints you used to design this activity.

The "rules" should be ${formValues.rules}

The "scoringSystem" should be ${formValues.scoringSystem}

The "winCondition" should be ${formValues.winCondition}

${formValues.finalGuidelines}
Ensure your JSON is properly formatted. Do not include any text outside of the JSON object in your response.
 DO NOT WRAP THE ANSWER IN BACKTICKS!`}
                                </pre>
                            </div>}
                            <div className="p-5 my-5 border rounded-md border-brand-200 bg-brand-50">
                                <h3 className="mb-3 text-lg font-medium text-brand-700">How This Affects Your Training Sessions</h3>
                                <p className="text-brand-700">
                                    The active generation engine now selects the system structure in code. These legacy prompt settings are no longer the source of truth for the live generation pipeline.
                                </p>
                            </div>
                        </>
                    )}
                </FormWrapper>
            </section>
        </div>
    )
}
