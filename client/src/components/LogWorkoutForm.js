import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import './LogWorkoutForm.css';

const Exercise = ({ exercise, exerciseIndex, control, register, removeExercise, categories }) => {
    const { fields: pairFields, append: appendPair, remove: removePair } = useFieldArray({
        control,
        name: `exercises[${exerciseIndex}].pairs`
    });

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

    const categories = {
        'Chest': ['InclineChest', 'ChestPress', 'Flys', 'ShoulderPress'],
        'Arms': ['Bis', 'TriPress', 'TriPullDown', "LateralRaise"],
        'Back': ['PullDown', 'RearDelt', 'Rows'],
        'Legs': ['HipAbductor', 'SeatedLegCurl', 'LegExtension', 'HipAdductor', 'LegPress'],
        'Abs': ['Abdominal', 'BackExtension', 'TorsoRotation']
    };

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
        } catch (error) {
            console.error('Error logging workout:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="log-workout-form">
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
