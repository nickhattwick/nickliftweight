import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import Chart from 'chart.js/auto';
import './Dashboard.css';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [workoutData, setWorkoutData] = useState(null);

    const categories = {
        'Chest': ['InclineChest', 'ChestPress', 'Flys', 'ShoulderPress'],
        'Arms': ['Bis', 'TriPress', 'TriPullDown', "LateralRaise"],
        'Back': ['PullDown', 'RearDelt', 'Rows'],
        'Legs': ['HipAbductor', 'SeatedLegCurl', 'LegExtension', 'HipAdductor', 'LegPress'],
        'Abs': ['Abdominal', 'BackExtension', 'TorsoRotation']
    };

    const [selectedCategory, setSelectedCategory] = useState(Object.keys(categories)[0]);

    // Fetch the workout data
    useEffect(() => {
        fetch('http://localhost:3000/dashboard', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                // Parse each weight to a float to ensure proper calculations
                const parsedData = data.map(workout => {
                    workout.Exercises = Object.fromEntries(
                        Object.entries(workout.Exercises).map(([key, value]) => [
                            key,
                            value.map(set => ({ ...set, weight: parseFloat(set.weight) })) // Ensure weight is a float
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

    // Prepare the data for the graph
    const prepareGraphData = (workoutData) => {
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
            <div className="page-header">
                <h1>Dashboard</h1>
            </div>
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
                                        borderColor: 'rgba(255, 99, 132, 0.2)',
                                    },
                                    {
                                        label: 'Average Weight',
                                        data: data.avgWeights,
                                        fill: false,
                                        backgroundColor: 'rgb(75, 192, 192)',
                                        borderColor: 'rgba(75, 192, 1920.2)',
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
                                            maxTicksLimit: 10
                                        }
                                    },
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                maintainAspectRatio: false
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
