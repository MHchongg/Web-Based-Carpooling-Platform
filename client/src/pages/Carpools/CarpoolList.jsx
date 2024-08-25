import * as React from 'react';
import { Box, Card, CardContent, Stack, Typography, Pagination } from '@mui/material';
import MonetizationOnTwoToneIcon from '@mui/icons-material/MonetizationOnTwoTone';
import TodayTwoToneIcon from '@mui/icons-material/TodayTwoTone';
import { useState, useEffect } from 'react';
import { orange } from '@mui/material/colors';
import EventSeatTwoToneIcon from '@mui/icons-material/EventSeatTwoTone';
import CarpoolModal from '../../components/CarpoolModal';
import { useSelector } from 'react-redux';
import FolderOffTwoToneIcon from '@mui/icons-material/FolderOffTwoTone';

export default function CarpoolList({ category, searchResult }) {

    const { carpoolList, myCarpoolList, myCarpoolJoinRequests, myJoinRequests, driverIsMeGroup } = useSelector(state => state.carpool)
    const [displayedCarpoolList, setDisplayedCarpoolList] = useState([])
    const [page, setPage] = useState(1)
    const carpoolsPerPage = 4

    useEffect(() => {
        let carpoolIDs = []
        switch (category) {
            case 0:
                setDisplayedCarpoolList(carpoolList.filter((carpool) => {
                    return carpool.carpool_type === 'fromDriver' && !myCarpoolList.includes(carpool.carpool_id) && carpool.carpool_status === 'available'
                }))
                break;

            case 1:
                setDisplayedCarpoolList(carpoolList.filter((carpool) => {
                    return carpool.carpool_type === 'fromStudent' && carpool.carpool_status === 'available'
                }))
                break;

            case 2:
                setDisplayedCarpoolList(carpoolList.filter((carpool) => {
                    return myCarpoolList.includes(carpool.carpool_id)
                }))
                break;

            case 3:
                let displayedMyCarpoolJoinRequests = []
                if (Array.isArray(myCarpoolJoinRequests)) {
                    carpoolIDs = myCarpoolJoinRequests.map(obj => obj.carpool_id)

                    carpoolIDs.forEach(id => {
                        carpoolList.forEach(carpool => {
                            if (carpool.carpool_id === id && carpool.carpool_status !== "Expired") {
                                displayedMyCarpoolJoinRequests.push(carpool)
                            }
                        })
                    })
                }

                setDisplayedCarpoolList(displayedMyCarpoolJoinRequests)
                break;

            case 4:
                let displayedMyJoinRequests = []
                if (Array.isArray(myJoinRequests)) {
                    carpoolIDs = myJoinRequests.map(obj => obj.carpool_id)

                    carpoolIDs.forEach(id => {
                        carpoolList.forEach(carpool => {
                            if (carpool.carpool_id === id) {
                                displayedMyJoinRequests.push(carpool)
                            }
                        })
                    })
                }

                setDisplayedCarpoolList(displayedMyJoinRequests)

                break;

            case 5:
                let displayedSearchResult = []
                if (Array.isArray(searchResult)) {
                    carpoolIDs = searchResult.map(obj => obj.carpool_id)

                    carpoolIDs.forEach(id => {
                        carpoolList.forEach(carpool => {
                            if (carpool.carpool_id === id) {
                                if (!myCarpoolList.includes(carpool.carpool_id)) {
                                    displayedSearchResult.push(carpool)
                                }
                            }
                        })
                    })
                }

                setDisplayedCarpoolList(displayedSearchResult)
                break;

            default:
                setDisplayedCarpoolList(carpoolList)
                break;
        }
    }, [category, carpoolList, myCarpoolList, myCarpoolJoinRequests, myJoinRequests, searchResult])

    const [carpoolModal, setCarpoolModal] = useState({
        isDisplay: false, carpoolInfo: {
            carpool: {},
            category: category,
            myCarpoolList: [],
            myCarpoolJoinRequests: [],
            myJoinRequests: [],
            driverIsMeGroup: [],
            searchResult: [],
            index: 0,
        }
    })

    const handleCarpoolModalClose = () => {
        setCarpoolModal({
            isDisplay: false, carpoolInfo: {
                carpool: {},
                category: category,
                myCarpoolList: [],
                myCarpoolJoinRequests: [],
                myJoinRequests: [],
                driverIsMeGroup: [],
                searchResult: [],
                index: 0,
            }
        });
    };

    const getCurrentPageCarpools = () => {
        const startIndex = (page - 1) * carpoolsPerPage;
        const endIndex = startIndex + carpoolsPerPage;
        return displayedCarpoolList.slice(startIndex, endIndex);
    }

    return (
        <>
            {displayedCarpoolList.length <= 0 
                ?
                <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
                    <FolderOffTwoToneIcon sx={{ color: orange[500], fontSize: '10rem' }} />
                    <Typography fontWeight={'bold'} fontSize={'large'}>Nothing here...</Typography>
                </Box>
                :
                <Stack direction="row" justifyContent="center" alignItems="center" flexWrap="wrap" spacing={{ xs: 3, sm: 2 }} useFlexGap>
                    {getCurrentPageCarpools().map((carpool, index) => (
                        <Card
                            variant='outlined'
                            key={category === 3 ? myCarpoolJoinRequests[index].request_id : carpool.carpool_id}
                            sx={{ width: '48%', border: 3, borderColor: orange[500], borderRadius: 5, boxShadow: 3 }}
                            className='carpool-card'
                            onClick={() => setCarpoolModal({
                                isDisplay: true, carpoolInfo: {
                                    carpool: carpool,
                                    category: category,
                                    myCarpoolList: myCarpoolList,
                                    myCarpoolJoinRequests: myCarpoolJoinRequests,
                                    myJoinRequests: myJoinRequests,
                                    driverIsMeGroup: driverIsMeGroup,
                                    searchResult: searchResult,
                                    index: index,
                                }
                            })}
                        >
                            <CardContent>
                                <Typography variant="h5" component="div" fontWeight='bold' sx={{ color: '#5b277b', marginBottom: '0.6rem' }}>
                                    {carpool.carpool_title}
                                </Typography>
                                <Stack spacing={1}>
                                    <Typography display={'flex'} alignItems={'center'} columnGap={1}><EventSeatTwoToneIcon sx={{ color: '#5b277b' }} /> Seats: {carpool.carpool_takenSeats}/{carpool.carpool_totalSeats}</Typography>
                                    <Typography display={'flex'} alignItems={'center'} columnGap={1}><MonetizationOnTwoToneIcon sx={{ color: '#5b277b' }} /> Price (per pax): RM {carpool.carpool_price}</Typography>
                                    <Typography display={'flex'} alignItems={'center'} columnGap={1}><TodayTwoToneIcon sx={{ color: '#5b277b' }} /> Departure Time: {carpool.carpool_dateTime}</Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                    <Box width={'100%'} marginTop={'1rem'} display={'flex'} justifyContent={'center'}>
                        <Pagination count={displayedCarpoolList.length > carpoolsPerPage ? Math.ceil(displayedCarpoolList.length / carpoolsPerPage) : 1 } color="secondary" page={page} onChange={(event, value) => setPage(value)} />
                    </Box>
                </Stack>
            }

            {carpoolModal.isDisplay && <CarpoolModal carpoolModal={carpoolModal} handleCarpoolModalClose={handleCarpoolModalClose} />}
        </>
    )
}