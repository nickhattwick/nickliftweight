import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import Chart from 'chart.js/auto';
import './Dashboard.css';


const Dashboard = () => {
    const [workoutData, setWorkoutData] = useState(null);

    // Fetch the workout data
    useEffect(() => {
      fetch('http://localhost:3000/dashboard', {
          credentials: 'include'
      })
          .then(response => {
              console.log('Response:', response);
              return response.text();  // Use text() to log the raw response body
          })
          .then(text => {
              console.log('Response Body:', text);
              return JSON.parse(text);  // Convert the text to JSON
          })
          .then(data => {
              console.log('Data:', data);
              setWorkoutData(data);
          })
          .catch(error => {
              console.error('Error:', error);
          });
    }, []);

    // Prepare the data for the graph
    const prepareGraphData = (workoutData) => {
        const processedData = workoutData.reduce((acc, workout) => {
            Object.entries(workout.Exercises).forEach(([exercise, sets]) => {
                if (!acc[exercise]) {
                    acc[exercise] = { maxWeights: [], avgWeights: [] };
                }

                const weights = sets.map(set => set.weight);
                const maxWeight = Math.max(...weights);
                const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

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
        <div className="chart-container">
            {Object.entries(graphData).map(([exercise, data]) => (
                <div key={exercise} className="chart-box">
                    <h3>{exercise}</h3> {/* Use h3 for subheaders */}
                    <Line
                      data={{
                          labels: workoutData.map(workout => new Date(workout.WorkoutDate)),
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
                                  borderColor: 'rgba(75, 192, 192, 0.2)',
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