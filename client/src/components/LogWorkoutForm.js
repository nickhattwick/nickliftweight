import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import './LogWorkoutForm.css';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';

const Exercise = ({ exercise, exerciseIndex, control, register, removeExercise, categories, handleNewExerciseSubmit, newExerciseName, setNewExerciseName, newExerciseCategory, setNewExerciseCategory }) => {
    const { fields: pairFields, append: appendPair, remove: removePair } = useFieldArray({
        control,
        name: `exercises[${exerciseIndex}].pairs`
    });

    const [isAddingCustomExercise, setIsAddingCustomExercise] = useState(false);

    const handleAddCustomExerciseClick = () => {
        setIsAddingCustomExercise(true);
    };

    const handleAddCustomExerciseCancel = () => {
        setIsAddingCustomExercise(false);
    };

    return (
        <div key={exercise.id} className="exercise-group">
            <label>
                Exercise:
                <select {...register(`exercises[${exerciseIndex}].name`)}>
                    {Object.values(categories).flat().map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </label>

            <button type="button" onClick={handleAddCustomExerciseClick}>
                Add Custom Exercise
            </button>

            {isAddingCustomExercise && (
                <div className="custom-exercise">
                    <label>
                        Name:
                        <input type="text" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} />
                    </label>
                    <label>
                        Category:
                        <input type="text" value={newExerciseCategory} onChange={(e) => setNewExerciseCategory(e.target.value)} />
                    </label>
                    <button type="button" onClick={handleNewExerciseSubmit}>Add</button>
                    <button type="button" onClick={handleAddCustomExerciseCancel}>Cancel</button>
                </div>
            )}

            {pairFields.map((pair, pairIndex) => (
                <div key={pair.id} className="pair-group">
                    <label>
                        Weight:
                        <input type="number" {...register(`exercises[${exerciseIndex}].pairs[${pairIndex}].weight`)} />
                    </label>
                    <label>
                        Reps:
                        <input type="number" {...register(`exercises[${exerciseIndex}].pairs[${pairIndex}].reps`)} />
                    </label>
                    <button type="button" className='remove-button' onClick={() => removePair(pairIndex)}>
                        Remove Pair
                    </button>
                </div>
            ))}

            <button type="button" className='add-button' onClick={() => appendPair({ weight: '', reps: '' })}>
                Add Pair
            </button>
            <button type="button" className='remove-button' onClick={() => removeExercise(exerciseIndex)}>
                Remove Exercise
            </button>
        </div>
    );
};

const LogWorkoutForm = () => {
    const navigate = useNavigate();

    const { register, control, handleSubmit } = useForm({
        defaultValues: {
            date: new Date().toISOString().substring(0, 10),
            exercises: [{ name: '', pairs: [{ weight: '', reps: '' }] }]
        }
    });

    const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
        control,
        name: 'exercises'
    });

    const [categories, setCategories] = useState({
        'Chest': ['InclineChest', 'ChestPress', 'Flys', 'ShoulderPress'],
        'Arms': ['Bis', 'TriPress', 'TriPullDown', 'TriExtension', "LateralRaise"],
        'Back': ['PullDown', 'RearDelt', 'Rows'],
        'Legs': ['HipAbductor', 'SeatedLegCurl', 'LegExtension', 'HipAdductor', 'LegPress'],
        'Abs': ['Abdominal', 'BackExtension', 'TorsoRotation']
    });
    useEffect(() => {
        const loadUserExercises = async () => {
            try {
                const response = await fetch(process.env.REACT_APP_SERVER_URL + '/load-exercises', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const jsonResponse = await response.json();
                                
                setCategories(prevCategories => {
                    const updatedCategories = { ...prevCategories };
                    jsonResponse.exercises.forEach(exercise => {
                        const category = exercise.ExerciseCategory;
                        const name = exercise.ExerciseName;
                        console.log(`category: ${category}, name: ${name}`);
                        if (!updatedCategories[category]) updatedCategories[category] = [];
                        if (!updatedCategories[category].includes(name)) {
                            updatedCategories[category].push(name);
                        }
                    });
                    console.log(updatedCategories);
                    return updatedCategories;
                });
            } catch (error) {
                console.error('Error loading exercises:', error);
            }
        };
        loadUserExercises();
    }, []);

    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseCategory, setNewExerciseCategory] = useState('');

    const onSubmit = async (data) => {    
        try {
            const response = await fetch(process.env.REACT_APP_SERVER_URL + '/log-workout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ ...data }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const jsonResponse = await response.json();
            console.log(jsonResponse.message);

            navigate('/dashboard');
        } catch (error) {
            console.error('Error logging workout:', error);
        }
    };

    const handleNewExerciseSubmit = async (event) => {
        event.preventDefault();

        const response = await fetch(process.env.REACT_APP_SERVER_URL + '/add-exercise', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: newExerciseName,
                category: newExerciseCategory,
            }),
            credentials: 'include',
        });

        if (response.ok) {
            // Reset the form
            setNewExerciseName('');
            setNewExerciseCategory('');
        } else {
            console.error('Failed to add exercise');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="log-workout-form">
            <button type="button" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
            </button>
            <div className="page-header">
                <h1>Log Workout</h1>
            </div>
            <label>
                Date:
                <input type="date" {...register('date')} />
            </label>

            {exerciseFields.map((exercise, index) => (
                <Exercise
                    key={exercise.id}
                    exercise={exercise}
                    exerciseIndex={index}
                    control={control}
                    register={register}
                    removeExercise={() => removeExercise(index)}
                    categories={categories}
                    newExerciseName={newExerciseName}
                    setNewExerciseName={setNewExerciseName}
                    newExerciseCategory={newExerciseCategory}
                    setNewExerciseCategory={setNewExerciseCategory}
                    handleNewExerciseSubmit={handleNewExerciseSubmit}
                />
            ))}

            <button type="button" className="add-button" onClick={() => appendExercise({ name: '', pairs: [{ weight: '', reps: '' }] })}>
                Add Exercise
            </button>

            <button type="submit" className="submit-button">Submit</button>
        </form>
    );
};

export default LogWorkoutForm;
