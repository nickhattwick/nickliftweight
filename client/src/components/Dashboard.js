import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import Chart from 'chart.js/auto';
import './Dashboard.css';
import { Link } from 'react-router-dom';
import Banner from './Banner';

const Dashboard = () => {
    const [workoutData, setWorkoutData] = useState(null);
    const initialCategories = {
        'Chest': ['InclineChest', 'ChestPress', 'Flys', 'ShoulderPress'],
        'Arms': ['Bis', 'TriPress', 'TriPullDown', 'TriExtension', "LateralRaise"],
        'Back': ['PullDown', 'RearDelt', 'Rows'],
        'Legs': ['HipAbductor', 'SeatedLegCurl', 'LegExtension', 'HipAdductor', 'LegPress'],
        'Abs': ['Abdominal', 'BackExtension', 'TorsoRotation']
    };

    const [categories, setCategories] = useState(initialCategories);
    const [selectedCategory, setSelectedCategory] = useState(Object.keys(initialCategories)[0]);
    
    // Fetch the workout data
    useEffect(() => {
        fetch(process.env.REACT_APP_SERVER_URL + '/dashboard-load', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                const parsedData = data.map(workout => {
                    workout.Exercises = Object.fromEntries(
                        Object.entries(workout.Exercises).map(([key, value]) => [
                            key,
                            value.map(set => ({ ...set, weight: parseFloat(set.weight) }))
                        ])
                    );
                    return workout;
                });
                setWorkoutData(parsedData);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }, []);

    // Fetch custom exercises and merge them with the hardcoded categories
    useEffect(() => {
        fetch(process.env.REACT_APP_SERVER_URL + '/load-exercises', {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            const fetchedExercises = data.exercises; // Unwrap the 'exercises' from the response
            const updatedCategories = { ...initialCategories };
    
            // Iterate over each fetched exercise
            fetchedExercises.forEach(exercise => {
                const { ExerciseCategory, ExerciseName } = exercise;
    
                // Check if the ExerciseCategory already exists, if not, initialize it
                if (!updatedCategories[ExerciseCategory]) {
                    updatedCategories[ExerciseCategory] = [];
                }
    
                // Add the ExerciseName to the appropriate category if it's not already there
                if (!updatedCategories[ExerciseCategory].includes(ExerciseName)) {
                    updatedCategories[ExerciseCategory].push(ExerciseName);
                }
            });
    
            // Debugging tip: Log the final structure of updatedCategories
            console.log("Updated categories after merge:", updatedCategories);
    
            // Update the categories state with the newly combined categories
            setCategories(updatedCategories);
    
            // Check if the selectedCategory is still valid, otherwise set it to the first category
            if (!updatedCategories[selectedCategory]) {
                setSelectedCategory(Object.keys(updatedCategories)[0]);
            }
        })
        .catch(error => console.error('Error loading exercises:', error));
    }, []);

    // Prepare the data for the graph
    const prepareGraphData = (workoutData) => {
        if (!selectedCategory || !categories[selectedCategory]) return {};
        workoutData.sort((a, b) => {
            const dateA = new Date(a.WorkoutDate + 'T00:00:00'); // Parse date as local
            const dateB = new Date(b.WorkoutDate + 'T00:00:00'); // Parse date as local
            return dateA - dateB;
        });
        const processedData = workoutData.reduce((acc, workout) => {
            Object.entries(workout.Exercises).forEach(([exercise, sets]) => {
                // Only process exercises in the selected category
                if (!categories[selectedCategory].includes(exercise)) {
                    return;
                }

                if (!acc[exercise]) {
                    acc[exercise] = { dates: [], maxWeights: [], avgWeights: [] };
                }

                const weights = sets.map(set => set.weight); // Weights are already floats
                const maxWeight = Math.max(...weights);
                const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

                acc[exercise].dates.push(new Date(workout.WorkoutDate + 'T00:00:00')); // Push parsed date
                acc[exercise].maxWeights.push(maxWeight);
                acc[exercise].avgWeights.push(avgWeight);
            });
            return acc;
        }, {});

        return processedData;
    };

    if (!workoutData) {
        return <div>Loading...</div>;
    }

    const graphData = prepareGraphData(workoutData);

    return (
        <div>
            <Banner />
            <div className="log-workout">
                <Link to="/log-workout">
                    <button>Log Workout</button>
                </Link>
            </div>
            {Object.keys(categories).map(category => (
                <button key={category} onClick={() => setSelectedCategory(category)}>
                    {category}
                </button>
            ))}
            <div className="chart-container">
              {Object.entries(graphData).map(([exercise, data]) => (
                <div key={exercise} className="chart-box">
                <h3>{exercise}</h3> {/* Use h3 for subheaders */}
                <Line
                    data={{
                    labels: data.dates, // Use dates from processed data
                    datasets: [
                        {
                        label: 'Max Weight',
                        data: data.maxWeights,
                        fill: false,
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)', // Made opaque for better visibility
                        pointBorderColor: 'rgb(255, 99, 132)',
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 5,
                        },
                        {
                        label: 'Average Weight',
                        data: data.avgWeights,
                        fill: false,
                        backgroundColor: 'rgb(75, 192, 192)',
                        borderColor: 'rgb(75, 192, 192)', // Made opaque for better visibility
                        pointBorderColor: 'rgb(75, 192, 192)',
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 5,
                        },
                    ],
                    }}
                    options={{
                    scales: {
                        x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        adapters: {
                            date: {
                            locale: enUS
                            }
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10,
                            color: 'white', // Change the color of x-axis labels
                            font: {
                            size: 14, // Change the font size of x-axis labels
                            },
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)', // Change the color of x-axis grid lines
                        },
                        },
                        y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'white', // Change the color of y-axis labels
                            font: {
                            size: 14, // Change the font size of y-axis labels
                            },
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)', // Change the color of y-axis grid lines
                        },
                        },
                    },
                    plugins: {
                        legend: {
                        labels: {
                            color: 'white', // Change the color of the legend text
                            font: {
                            size: 14, // Change the font size of the legend text
                            },
                        },
                        },
                        tooltip: {
                        bodyFont: {
                            size: 14, // Change the font size of the tooltip text
                        },
                        titleFont: {
                            size: 14, // Change the font size of the tooltip title
                        },
                        },
                    },
                    maintainAspectRatio: false,
                    }}
                />
                </div>
              ))}
            </div>
        </div>
    );
};

export default Dashboard;
